// bookingController.ts (Member 5)
// Booking controller - Contains business logic for booking-related operations
// Handles booking creation, retrieval, cancellation, and booking confirmation

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking, { BookingDocument } from '../models/Booking';
import Showtime from '../models/Showtime';
import websocketService from '../services/websocket';
// Import to ensure Express Request type is extended with user property
import '../middlewares/auth';

/* =======================
  Helper Functions
======================= */

// Check if user is platform admin
const isPlatformAdmin = (req: Request): boolean => {
  return req.user?.role === 'platform_admin';
};

// Check if user is cinema admin
const isCinemaAdmin = (req: Request): boolean => {
  return req.user?.role === 'cinema_admin';
};

// Check if user is admin (platform or cinema)
const isAdmin = (req: Request): boolean => {
  return isPlatformAdmin(req) || isCinemaAdmin(req);
};

// Get user ID from request
const getUserId = (req: Request): string | undefined => {
  return req.user?._id?.toString();
};

// Get Seat model dynamically (handles case where Member 6 hasn't implemented it yet)
const getSeatModel = () => {
  try {
    return mongoose.model('Seat');
  } catch {
    return null;
  }
};

// Seat hold duration in milliseconds (10 minutes)
const SEAT_HOLD_DURATION_MS = 10 * 60 * 1000;

/* =======================
  1. Create Booking
======================= */

/**
 * Create a new booking with pending status
 * - Validates showtime exists and is bookable
 * - Checks seats are available
 * - Calculates total amount
 * - Updates seat statuses to 'held'
 * - Returns booking with 10-minute hold time
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { showtimeId, seatIds } = req.body;

    // Validate required fields
    if (!showtimeId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Showtime ID is required' },
      });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one seat must be selected' },
      });
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(showtimeId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid showtime ID' },
      });
    }

    for (const seatId of seatIds) {
      if (!mongoose.isValidObjectId(seatId)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid seat ID: ${seatId}` },
        });
      }
    }

    // Find showtime and check if bookable
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({
        success: false,
        error: { message: 'Showtime not found' },
      });
    }

    if (!showtime.isActive) {
      return res.status(400).json({
        success: false,
        error: { message: 'Showtime is not available for booking' },
      });
    }

    if (!showtime.isBookable()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Showtime is not available for booking (past or sold out)',
        },
      });
    }

    // Check if enough seats are available
    if (showtime.availableSeats < seatIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Not enough seats available. Only ${showtime.availableSeats} seats left.`,
        },
      });
    }

    // Check seat availability if Seat model is available
    const Seat = getSeatModel();
    if (Seat) {
      const seats = await Seat.find({
        _id: { $in: seatIds },
        showtimeId: showtimeId,
      });

      if (seats.length !== seatIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more seats not found for this showtime' },
        });
      }

      const unavailableSeats = seats.filter(
        (seat: { status: string }) => seat.status !== 'available'
      );
      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more selected seats are not available' },
        });
      }

      // Update seats to 'held' status
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        {
          status: 'held',
          heldBy: userId,
          heldUntil: new Date(Date.now() + SEAT_HOLD_DURATION_MS),
        }
      );
    }

    // Calculate total amount
    const totalAmount = showtime.price * seatIds.length;

    // Create booking
    const booking = await Booking.create({
      userId: new mongoose.Types.ObjectId(userId),
      showtimeId: new mongoose.Types.ObjectId(showtimeId),
      seatIds: seatIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      numberOfSeats: seatIds.length,
      totalAmount,
      bookingStatus: 'pending',
      bookingDate: new Date(),
    });

    // Emit WebSocket event for seat updates
    for (const seatId of seatIds) {
      websocketService.broadcastSeatUpdate(showtimeId, {
        seatId,
        status: 'held',
        heldBy: userId,
      });
    }

    // Populate the booking
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration' },
          { path: 'cinemaId', select: 'name location' },
        ],
      });

    res.status(201).json({
      success: true,
      data: {
        booking: populatedBooking,
        holdExpiresAt: new Date(Date.now() + SEAT_HOLD_DURATION_MS),
        message: `Seats held for 10 minutes. Complete payment to confirm booking.`,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create booking' },
    });
  }
};

/* =======================
  2. Confirm Booking
======================= */

/**
 * Confirm a booking after payment succeeds
 * - Updates booking status to 'confirmed'
 * - Updates seats from 'held' to 'booked'
 * - Updates showtime availableSeats count
 * - Generates QR code
 */
export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { paymentId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID' },
      });
    }

    // Find booking
    const booking = (await Booking.findById(id)) as BookingDocument | null;
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    // Check ownership (user or admin)
    if (booking.userId.toString() !== userId && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to confirm this booking' },
      });
    }

    // Check booking status
    if (booking.bookingStatus === 'confirmed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking is already confirmed' },
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot confirm a cancelled booking' },
      });
    }

    // Update booking
    booking.bookingStatus = 'confirmed';
    if (paymentId && mongoose.isValidObjectId(paymentId)) {
      booking.paymentId = new mongoose.Types.ObjectId(paymentId);
    }

    // Generate QR code
    const qrCode = booking.generateQRCode();
    booking.qrCode = qrCode;

    await booking.save();

    // Update seats to 'booked' status
    const Seat = getSeatModel();
    if (Seat) {
      await Seat.updateMany(
        { _id: { $in: booking.seatIds } },
        {
          status: 'booked',
          bookingId: booking._id,
          heldBy: null,
          heldUntil: null,
        }
      );
    }

    // Update showtime available seats
    await Showtime.findByIdAndUpdate(booking.showtimeId, {
      $inc: { availableSeats: -booking.numberOfSeats },
    });

    // Emit WebSocket events
    const showtimeId = booking.showtimeId.toString();

    // Notify about seat status change
    for (const seatId of booking.seatIds) {
      websocketService.broadcastSeatUpdate(showtimeId, {
        seatId: seatId.toString(),
        status: 'booked',
      });
    }

    // Broadcast booking confirmation
    websocketService.broadcastBookingConfirmed(showtimeId, {
      bookingId: booking._id.toString(),
      numberOfSeats: booking.numberOfSeats,
    });

    // Get showtime with cinema for admin notification
    const showtime = await Showtime.findById(booking.showtimeId);
    if (showtime) {
      websocketService.notifyCinemaAdmin(showtime.cinemaId.toString(), {
        bookingId: booking._id.toString(),
        userId: booking.userId.toString(),
        numberOfSeats: booking.numberOfSeats,
        totalAmount: booking.totalAmount,
      });

      // Broadcast showtime update
      websocketService.broadcastShowtimeUpdated(showtimeId, {
        availableSeats: showtime.availableSeats - booking.numberOfSeats,
      });
    }

    // Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration' },
          { path: 'cinemaId', select: 'name location' },
        ],
      });

    res.json({
      success: true,
      data: {
        booking: populatedBooking,
        message: 'Booking confirmed successfully',
      },
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to confirm booking' },
    });
  }
};

/* =======================
  3. Get Booking By ID
======================= */

/**
 * Get a specific booking by ID
 * - Populates all relations
 * - Checks user owns booking or is admin
 */
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID' },
      });
    }

    const booking = await Booking.findById(id)
      .populate('userId', 'firstName lastName email phone')
      // Note: seatIds are stored as ObjectId array, no Seat model needed for basic functionality
      // Note: paymentId population skipped - Payment model is a placeholder
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration genre rating' },
          { path: 'cinemaId', select: 'name location facilities' },
        ],
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    // Check ownership - handle both populated and non-populated userId
    const bookingUserId =
      typeof booking.userId === 'object' && booking.userId !== null
        ? String(
            (booking.userId as unknown as { _id: mongoose.Types.ObjectId })._id
          )
        : String(booking.userId);

    if (bookingUserId !== userId && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this booking' },
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch booking' },
    });
  }
};

/* =======================
  4. Get User Bookings
======================= */

/**
 * Get all bookings for the current user
 * - Populates showtime, movie, cinema, seats
 * - Sorts by bookingDate descending
 */
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (
      status &&
      ['pending', 'confirmed', 'cancelled'].includes(status as string)
    ) {
      filter.bookingStatus = status;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit as string, 10) || 10)
    );
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Booking.countDocuments(filter);

    // Get bookings
    const bookings = await Booking.find(filter)
      // Note: seatIds are stored as ObjectId array, no Seat model needed for basic functionality
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration genre rating' },
          { path: 'cinemaId', select: 'name location' },
        ],
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch bookings' },
    });
  }
};

/* =======================
  5. Cancel Booking
======================= */

/**
 * Cancel a booking
 * - Checks can cancel (showtime not started)
 * - Updates booking status to 'cancelled'
 * - Releases seats (set to 'available')
 * - Updates showtime availableSeats
 */
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID' },
      });
    }

    // Find booking
    const booking = (await Booking.findById(id)) as BookingDocument | null;
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    // Check ownership
    if (booking.userId.toString() !== userId && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to cancel this booking' },
      });
    }

    // Check if already cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking is already cancelled' },
      });
    }

    // Check if can cancel
    const canCancel = await booking.canCancel();
    if (!canCancel) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot cancel booking - showtime has already started',
        },
      });
    }

    const wasConfirmed = booking.bookingStatus === 'confirmed';
    const showtimeId = booking.showtimeId.toString();

    // Update booking status
    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Release seats
    const Seat = getSeatModel();
    if (Seat) {
      await Seat.updateMany(
        { _id: { $in: booking.seatIds } },
        {
          status: 'available',
          heldBy: null,
          heldUntil: null,
          bookingId: null,
        }
      );
    }

    // Update showtime available seats (only if was confirmed)
    if (wasConfirmed) {
      await Showtime.findByIdAndUpdate(booking.showtimeId, {
        $inc: { availableSeats: booking.numberOfSeats },
      });
    }

    // Emit WebSocket events
    for (const seatId of booking.seatIds) {
      websocketService.broadcastSeatUpdate(showtimeId, {
        seatId: seatId.toString(),
        status: 'available',
      });
    }

    // Broadcast seats refresh
    websocketService.broadcastSeatsRefresh(showtimeId);

    // Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl' },
          { path: 'cinemaId', select: 'name' },
        ],
      });

    res.json({
      success: true,
      data: {
        booking: populatedBooking,
        message: 'Booking cancelled successfully',
        refundRequired: wasConfirmed,
      },
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel booking' },
    });
  }
};

/* =======================
  6. Get All Bookings (Admin)
======================= */

/**
 * Get all bookings (admin only)
 * - With filters: userId, showtimeId, status, date
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    // Check admin access
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Admin access required' },
      });
    }

    const {
      userId,
      showtimeId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (userId && mongoose.isValidObjectId(userId as string)) {
      filter.userId = new mongoose.Types.ObjectId(userId as string);
    }

    if (showtimeId && mongoose.isValidObjectId(showtimeId as string)) {
      filter.showtimeId = new mongoose.Types.ObjectId(showtimeId as string);
    }

    if (
      status &&
      ['pending', 'confirmed', 'cancelled'].includes(status as string)
    ) {
      filter.bookingStatus = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) {
        (filter.bookingDate as Record<string, Date>).$gte = new Date(
          startDate as string
        );
      }
      if (endDate) {
        (filter.bookingDate as Record<string, Date>).$lte = new Date(
          endDate as string
        );
      }
    }

    // For cinema admin, filter by their cinema's showtimes
    if (isCinemaAdmin(req) && req.user?.cinemaId) {
      const cinemaShowtimes = await Showtime.find({
        cinemaId: req.user.cinemaId,
      }).select('_id');
      const showtimeIds = cinemaShowtimes.map((s) => s._id);
      filter.showtimeId = { $in: showtimeIds };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10) || 20)
    );
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Booking.countDocuments(filter);

    // Get bookings
    const bookings = await Booking.find(filter)
      .populate('userId', 'firstName lastName email')
      // Note: seatIds are stored as ObjectId array, no Seat model needed for basic functionality
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl' },
          { path: 'cinemaId', select: 'name location' },
        ],
      })
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch bookings' },
    });
  }
};

export default {
  createBooking,
  confirmBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
  getAllBookings,
};

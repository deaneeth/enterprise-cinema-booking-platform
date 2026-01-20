// bookingController.ts (Member 5)
// Booking controller - Contains business logic for booking-related operations
// Handles booking creation, retrieval, cancellation, and booking confirmation

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking, { BookingDocument } from '../models/Booking';
import Showtime from '../models/Showtime';
import websocketService from '../services/websocket';
import auditService from '../services/audit';
// Import to ensure Express Request type is extended with user property
import '../middlewares/auth';
import seatCleanupService from '../services/seatCleanup';

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

    // Check for existing pending booking for this user and showtime
    // Prevents creating duplicate bookings
    const existingPendingBooking = await Booking.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      showtimeId: new mongoose.Types.ObjectId(showtimeId),
      bookingStatus: 'pending',
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (existingPendingBooking) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'You already have a pending booking for this showtime',
          code: 'EXISTING_PENDING_BOOKING',
          existingBookingId: existingPendingBooking._id,
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

      // Check for truly unavailable seats (booked, or held by ANOTHER user AND not expired)
      const now = new Date();
      const unavailableSeats = seats.filter(
        (seat: {
          status: string;
          heldUntil?: Date;
          heldBy?: { toString: () => string } | string;
        }) => {
          // 'booked' seats are always unavailable
          if (seat.status === 'booked') return true;
          // 'held' seats are unavailable only if held by another user and not expired
          if (seat.status === 'held') {
            const seatHeldBy = seat.heldBy?.toString();
            // If held by the same user trying to book, it's available for them
            if (seatHeldBy === userId) return false;
            // If held by another user and not expired, it's unavailable
            return seat.heldUntil && new Date(seat.heldUntil) > now;
          }
          // 'available' seats are available
          return false;
        }
      );
      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more selected seats are not available' },
        });
      }

      // Release any expired holds before updating to 'held'
      await Seat.updateMany(
        {
          _id: { $in: seatIds },
          status: 'held',
          heldUntil: { $lt: now },
        },
        {
          $set: {
            status: 'available',
            heldBy: null,
            heldUntil: null,
          },
        }
      );
    }

    // Get the earliest heldUntil from seats to preserve remaining time
    // This prevents timer from resetting when user proceeds to payment
    let expiresAt = new Date(Date.now() + SEAT_HOLD_DURATION_MS);
    const currentTime = new Date();
    if (Seat) {
      const heldSeats = await Seat.find({
        _id: { $in: seatIds },
        status: 'held',
        heldBy: userId,
        heldUntil: { $gt: currentTime },
      }).select('heldUntil');

      if (heldSeats.length > 0) {
        // Use the earliest expiry to preserve remaining time
        const earliestExpiry = heldSeats.reduce(
          (earliest: Date, seat: { heldUntil?: Date }) => {
            if (seat.heldUntil && seat.heldUntil < earliest) {
              return seat.heldUntil;
            }
            return earliest;
          },
          heldSeats[0].heldUntil || expiresAt
        );
        expiresAt = earliestExpiry;
        console.log(
          `[Booking] Using seat heldUntil for booking expiry: ${expiresAt.toISOString()}`
        );
      }
    }

    // Update seats with booking's expiresAt (if Seat model available)
    if (Seat) {
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        {
          $set: {
            status: 'held',
            heldBy: userId,
            heldUntil: expiresAt, // Synced to booking's expiresAt
          },
        }
      );
    }

    // Calculate total amount from actual seat prices
    let totalAmount = 0;
    if (Seat) {
      const seatDocs = await Seat.find({ _id: { $in: seatIds } });
      totalAmount = seatDocs.reduce(
        (sum: number, seat: { price?: number }) =>
          sum + (seat.price || showtime.price),
        0
      );
    } else {
      // Fallback to showtime price if Seat model not available
      totalAmount = showtime.price * seatIds.length;
    }

    // Create booking with expiresAt (single source of truth)
    const booking = await Booking.create({
      userId: new mongoose.Types.ObjectId(userId),
      showtimeId: new mongoose.Types.ObjectId(showtimeId),
      seatIds: seatIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      numberOfSeats: seatIds.length,
      totalAmount,
      bookingStatus: 'pending',
      bookingDate: new Date(),
      expiresAt, // Single source of truth for timer
    });

    console.log('[Booking] Created:', {
      bookingId: booking._id,
      seatIdsReceived: seatIds.length,
      seatIdsStored: booking.seatIds.length,
      numberOfSeats: booking.numberOfSeats,
      totalAmount: booking.totalAmount,
    });

    // Emit WebSocket event for seat updates
    for (const seatId of seatIds) {
      websocketService.broadcastSeatUpdate(showtimeId, {
        seatId,
        status: 'held',
        heldBy: userId,
      });
    }

    // Audit: Log hold creation and seat hold events
    auditService.logHoldCreated({
      bookingId: booking._id.toString(),
      showtimeId,
      seatIds: seatIds.map((id: string) => id),
      userId,
      expiresAt,
    });
    auditService.logSeatsHeld({
      bookingId: booking._id.toString(),
      showtimeId,
      seatIds: seatIds.map((id: string) => id),
      userId,
    });

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
        expiresAt, // Single source of truth - same as booking.expiresAt
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

const executeBookingConfirmationTransaction = async (
  bookingId: mongoose.Types.ObjectId,
  paymentId: mongoose.Types.ObjectId | null
): Promise<{
  booking: BookingDocument;
  seatIds: mongoose.Types.ObjectId[];
}> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      _id: bookingId,
      bookingStatus: 'pending',
      expiresAt: { $gt: new Date() },
    }).session(session);

    if (!booking) {
      throw new Error('Booking no longer valid for confirmation');
    }

    booking.bookingStatus = 'confirmed';
    if (paymentId) {
      booking.paymentId = paymentId;
    }
    booking.generateQRCode();
    await booking.save({ session });

    const Seat = getSeatModel();
    const seatIds = booking.seatIds.map((id: mongoose.Types.ObjectId) => id);

    if (Seat && seatIds.length > 0) {
      await Seat.updateMany(
        { _id: { $in: seatIds }, status: 'held' },
        {
          $set: {
            status: 'booked',
            bookingId: booking._id,
            heldBy: null,
            heldUntil: null,
          },
        },
        { session }
      );
    }

    await Showtime.findByIdAndUpdate(
      booking.showtimeId,
      { $inc: { availableSeats: -booking.numberOfSeats } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { booking, seatIds };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

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

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    if (booking.userId.toString() !== userId && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to confirm this booking' },
      });
    }

    if (booking.bookingStatus === 'confirmed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking is already confirmed' },
      });
    }

    if (
      booking.bookingStatus === 'cancelled' ||
      booking.bookingStatus === 'expired'
    ) {
      return res.status(400).json({
        success: false,
        error: { message: `Cannot confirm a ${booking.bookingStatus} booking` },
      });
    }

    const parsedPaymentId =
      paymentId && mongoose.isValidObjectId(paymentId)
        ? new mongoose.Types.ObjectId(paymentId)
        : null;

    let txResult;
    let retryCount = 0;
    const maxRetries = 1;

    while (retryCount <= maxRetries) {
      try {
        txResult = await executeBookingConfirmationTransaction(
          booking._id as mongoose.Types.ObjectId,
          parsedPaymentId
        );
        break;
      } catch (txError: unknown) {
        const err = txError as {
          hasErrorLabel?: (label: string) => boolean;
          message?: string;
        };
        const isTransient =
          err.hasErrorLabel?.('TransientTransactionError') ||
          err.message?.includes('TransientTransactionError');
        if (isTransient && retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        console.error('Booking confirmation transaction failed:', txError);
        return res.status(500).json({
          success: false,
          error: { message: 'Failed to confirm booking' },
        });
      }
    }

    const showtimeId = txResult!.booking.showtimeId.toString();

    for (const seatId of txResult!.seatIds) {
      websocketService.broadcastSeatUpdate(showtimeId, {
        seatId: seatId.toString(),
        status: 'booked',
      });
    }

    websocketService.broadcastBookingConfirmed(showtimeId, {
      bookingId: txResult!.booking._id.toString(),
      numberOfSeats: txResult!.booking.numberOfSeats,
    });

    const showtime = await Showtime.findById(txResult!.booking.showtimeId);
    if (showtime) {
      websocketService.notifyCinemaAdmin(showtime.cinemaId.toString(), {
        bookingId: txResult!.booking._id.toString(),
        userId: txResult!.booking.userId.toString(),
        numberOfSeats: txResult!.booking.numberOfSeats,
        totalAmount: txResult!.booking.totalAmount,
      });
      websocketService.broadcastShowtimeUpdated(showtimeId, {
        availableSeats: showtime.availableSeats,
      });
    }

    const populatedBooking = await Booking.findById(txResult!.booking._id)
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
      .populate('seatIds', 'seatNumber row column seatType price status')
      .populate('paymentId')
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

    // Debug: Log seat info to diagnose missing seats issue
    console.log('[Booking] GetById:', {
      bookingId: booking._id,
      numberOfSeats: booking.numberOfSeats,
      seatIdsPopulated: Array.isArray(booking.seatIds)
        ? booking.seatIds.length
        : 'not array',
      seatNumbers: Array.isArray(booking.seatIds)
        ? (booking.seatIds as Array<{ seatNumber?: string }>).map(
            (s) => s?.seatNumber || 'unknown'
          )
        : 'N/A',
    });

    // Lazy Read: Check and expire if pending booking has expired
    // The helper returns the updated booking (modified in place)
    await seatCleanupService.checkAndExpireBooking(booking);

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
      serverTime: new Date().toISOString(),
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
  4. Update Booking Seats
======================= */

/**
 * Update booking seats (pending only)
 * - Does NOT extend expiresAt
 * - Recalculates total amount
 */
export const updateBookingSeats = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { seatIds } = req.body as { seatIds?: string[] };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID' },
      });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one seat must be selected' },
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

    const booking = (await Booking.findById(id)) as BookingDocument | null;
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    if (booking.userId.toString() !== userId && !isAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this booking' },
      });
    }

    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'Only pending bookings can be updated' },
      });
    }

    if (booking.expiresAt && booking.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking hold has expired' },
      });
    }

    const Seat = getSeatModel();
    if (Seat) {
      const seats = await Seat.find({
        _id: { $in: seatIds },
        showtimeId: booking.showtimeId,
      });

      if (seats.length !== seatIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more seats not found for this showtime' },
        });
      }

      const now = new Date();
      const unavailableSeats = seats.filter(
        (seat: {
          status: string;
          heldUntil?: Date;
          heldBy?: { toString: () => string } | string;
        }) => {
          if (seat.status === 'booked') return true;
          if (seat.status === 'held') {
            const seatHeldBy = seat.heldBy?.toString();
            if (seatHeldBy === userId) return false;
            return seat.heldUntil && new Date(seat.heldUntil) > now;
          }
          return false;
        }
      );

      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'One or more selected seats are not available' },
        });
      }

      // Align heldUntil to booking.expiresAt without extending it
      if (booking.expiresAt) {
        await Seat.updateMany(
          { _id: { $in: seatIds } },
          {
            $set: {
              status: 'held',
              heldBy: userId,
              heldUntil: booking.expiresAt,
            },
          }
        );
      }
    }

    // Recalculate total amount
    let totalAmount = 0;
    if (Seat) {
      const seatDocs = await Seat.find({ _id: { $in: seatIds } });
      totalAmount = seatDocs.reduce(
        (sum: number, seat: { price?: number }) => sum + (seat.price || 0),
        0
      );
    } else {
      const showtime = await Showtime.findById(booking.showtimeId);
      totalAmount = showtime ? showtime.price * seatIds.length : 0;
    }

    booking.seatIds = seatIds.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );
    booking.numberOfSeats = seatIds.length;
    booking.totalAmount = totalAmount;

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration' },
          { path: 'cinemaId', select: 'name location' },
        ],
      });

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking seats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update booking seats' },
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

    // Lazy Read: Check and expire pending bookings
    await Promise.all(
      bookings.map((booking) =>
        seatCleanupService.checkAndExpireBooking(booking)
      )
    );

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
          $set: {
            status: 'available',
            heldBy: null,
            heldUntil: null,
            bookingId: null,
          },
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

    // Audit: Log booking cancellation
    auditService.logBookingCancelled({
      bookingId: booking._id.toString(),
      showtimeId,
      seatIds: booking.seatIds.map((id) => id.toString()),
      userId,
      trigger: 'user_action',
    });

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

    // Lazy Read: Check and expire pending bookings
    await Promise.all(
      bookings.map((booking) =>
        seatCleanupService.checkAndExpireBooking(booking)
      )
    );

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
  updateBookingSeats,
  getUserBookings,
  cancelBooking,
  getAllBookings,
};

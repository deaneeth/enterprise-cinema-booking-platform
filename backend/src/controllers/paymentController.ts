// paymentController.ts (Member 7)
// Payment controller - Contains business logic for payment-related operations
// Handles PayPal payment processing, verification, refunds, and transaction management

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import paypalService from '../services/payment';
import emailService from '../services/email';
// Import to ensure Express Request type is extended with user property
import '../middlewares/auth';

/* =======================
  Helper Functions
======================= */

// Check if user is platform admin
const isPlatformAdmin = (req: Request): boolean => {
  return req.user?.role === 'platform_admin';
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

// Booking expiration duration in milliseconds (10 minutes)
const BOOKING_EXPIRY_MS = 10 * 60 * 1000;

/* =======================
  1. Create PayPal Order
======================= */

/**
 * Create a PayPal order for a pending booking
 * - Validates booking exists and belongs to user
 * - Checks booking is pending and not expired
 * - Creates PayPal order and Payment record
 * - Returns orderId and approvalUrl for frontend
 */
export const createPayPalOrder = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { bookingId } = req.body;

    // Validate booking ID
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Booking ID is required' },
      });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID' },
      });
    }

    // Find booking with populated details
    const booking = await Booking.findById(bookingId).populate({
      path: 'showtimeId',
      populate: [
        { path: 'movieId', select: 'title' },
        { path: 'cinemaId', select: 'name' },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { message: 'Booking not found' },
      });
    }

    // Verify booking belongs to current user
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to pay for this booking' },
      });
    }

    // Check booking status is pending
    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot create payment for ${booking.bookingStatus} booking`,
        },
      });
    }

    // Check if booking is expired (10 minute window)
    const bookingAge = Date.now() - new Date(booking.createdAt).getTime();
    if (bookingAge > BOOKING_EXPIRY_MS) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Booking has expired. Please create a new booking.',
        },
      });
    }

    // Check if payment already exists for this booking
    const existingPayment = await Payment.findOne({
      bookingId: booking._id,
      paymentStatus: { $in: ['pending', 'completed'] },
    });

    if (existingPayment) {
      if (existingPayment.paymentStatus === 'completed') {
        return res.status(400).json({
          success: false,
          error: { message: 'Payment already completed for this booking' },
        });
      }

      // Return existing pending order
      return res.status(200).json({
        success: true,
        data: {
          orderId: existingPayment.paypalOrderId,
          approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${existingPayment.paypalOrderId}`,
          message: 'Existing payment order found',
        },
      });
    }

    // Build description for PayPal order
    const showtime = booking.showtimeId as any;
    const movieTitle = showtime?.movieId?.title || 'Movie';
    const cinemaName = showtime?.cinemaId?.name || 'Cinema';
    const showtimeDate = showtime?.startTime
      ? new Date(showtime.startTime).toLocaleDateString()
      : 'TBD';
    const showtimeTime = showtime?.startTime
      ? new Date(showtime.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'TBD';

    const description = `Movie: ${movieTitle} at ${cinemaName} - ${showtimeDate} ${showtimeTime}`;

    // Create PayPal order
    const { orderId, approvalUrl } = await paypalService.createOrder(
      booking._id.toString(),
      booking.totalAmount,
      description
    );

    // Create Payment record
    await Payment.create({
      bookingId: booking._id,
      userId: new mongoose.Types.ObjectId(userId),
      amount: booking.totalAmount,
      currency: 'USD',
      paymentMethod: 'paypal',
      paymentStatus: 'pending',
      paypalOrderId: orderId,
    });

    res.status(200).json({
      success: true,
      data: {
        orderId,
        approvalUrl,
      },
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create PayPal order' },
    });
  }
};

/* =======================
  2. Capture PayPal Payment
======================= */

/**
 * Capture payment after user approves in PayPal
 * - Finds payment by PayPal order ID
 * - Captures payment through PayPal
 * - Updates payment, booking, and seat statuses
 * - Generates QR code for booking
 */
export const capturePayPalPayment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'PayPal order ID is required' },
      });
    }

    // Find payment by PayPal order ID
    const payment = await Payment.findByPayPalOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found for this order' },
      });
    }

    // Verify payment belongs to current user
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to capture this payment' },
      });
    }

    // Check payment status
    if (payment.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot capture ${payment.paymentStatus} payment`,
        },
      });
    }

    // Capture payment through PayPal
    let captureResult;
    try {
      captureResult = await paypalService.capturePayment(orderId);
    } catch (paypalError: any) {
      // Update payment status to failed
      payment.paymentStatus = 'failed';
      await payment.save();

      console.error('PayPal capture error:', paypalError);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Payment capture failed. Please try again.',
          details: paypalError.message,
        },
      });
    }

    if (!captureResult.success) {
      // Update payment status to failed
      payment.paymentStatus = 'failed';
      await payment.save();

      return res.status(400).json({
        success: false,
        error: { message: 'Payment was not completed successfully' },
      });
    }

    // Update payment with capture details
    payment.paymentStatus = 'completed';
    payment.paypalCaptureId = captureResult.captureId;
    payment.payerEmail = captureResult.payerEmail;
    payment.payerName = captureResult.payerName;
    payment.paymentDate = new Date();
    payment.paymentMethod = captureResult.paymentMethod;

    if (captureResult.cardDetails) {
      payment.paymentDetails = {
        cardBrand: captureResult.cardDetails.brand,
        cardLastFour: captureResult.cardDetails.lastFour,
      };
    }

    await payment.save();

    // Update booking status to confirmed
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.bookingStatus = 'confirmed';
      booking.paymentId = payment._id as mongoose.Types.ObjectId;

      // Generate QR code
      booking.generateQRCode();
      await booking.save();

      // Update seats to 'booked' status
      const Seat = getSeatModel();
      if (Seat && booking.seatIds && booking.seatIds.length > 0) {
        await Seat.updateMany(
          { _id: { $in: booking.seatIds } },
          {
            status: 'booked',
            heldBy: null,
            heldUntil: null,
          }
        );
      }
    }

    // Populate booking for response
    const populatedBooking = await Booking.findById(payment.bookingId)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration rating' },
          { path: 'cinemaId', select: 'name location' },
        ],
      })
      .populate('seatIds');

    // Send email confirmation (console log)
    if (populatedBooking && req.user) {
      try {
        await emailService.sendPaymentConfirmation(
          populatedBooking as any,
          payment,
          req.user as any
        );
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: {
        payment,
        booking: populatedBooking,
        message: 'Payment captured successfully',
      },
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to capture payment' },
    });
  }
};

/* =======================
  3. Get Payment by ID
======================= */

/**
 * Get payment details by ID
 * - Populates booking with showtime, movie, cinema
 * - Verifies user owns payment or is admin
 */
export const getPaymentById = async (req: Request, res: Response) => {
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
        error: { message: 'Invalid payment ID' },
      });
    }

    const payment = await Payment.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'userId', select: 'firstName lastName email' },
          {
            path: 'showtimeId',
            populate: [
              { path: 'movieId', select: 'title posterUrl duration rating' },
              { path: 'cinemaId', select: 'name location' },
            ],
          },
          { path: 'seatIds' },
        ],
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found' },
      });
    }

    // Check ownership or admin
    if (payment.userId.toString() !== userId && !isPlatformAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this payment' },
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payment' },
    });
  }
};

/* =======================
  4. Get User Payments
======================= */

/**
 * Get all payments for the current user
 * - Populates booking with showtime, movie, cinema
 * - Sorted by createdAt descending
 */
export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const payments = await Payment.find({ userId })
      .populate({
        path: 'bookingId',
        populate: [
          {
            path: 'showtimeId',
            populate: [
              { path: 'movieId', select: 'title posterUrl duration rating' },
              { path: 'cinemaId', select: 'name location' },
            ],
          },
          { path: 'seatIds' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payments' },
    });
  }
};

/* =======================
  5. Process Refund
======================= */

/**
 * Process refund for a completed payment
 * - Admin only or booking owner (if showtime not passed)
 * - Processes refund through PayPal
 * - Updates payment, booking, and seat statuses
 */
export const processRefund = async (req: Request, res: Response) => {
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
        error: { message: 'Invalid payment ID' },
      });
    }

    // Find payment
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found' },
      });
    }

    // Check if user can refund (owner or admin)
    const isOwner = payment.userId.toString() === userId;
    const isAdmin = isPlatformAdmin(req);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to refund this payment' },
      });
    }

    // Verify payment can be refunded
    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot refund ${payment.paymentStatus} payment`,
        },
      });
    }

    if (!payment.paypalCaptureId) {
      return res.status(400).json({
        success: false,
        error: { message: 'No capture ID found for refund' },
      });
    }

    // Check if payment can be refunded (within 180 days)
    if (!payment.canRefund()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Payment is not eligible for refund' },
      });
    }

    // Get booking and check if showtime has passed
    const booking = await Booking.findById(payment.bookingId).populate(
      'showtimeId'
    );

    if (booking && !isAdmin) {
      const canCancel = await booking.canCancel();
      if (!canCancel) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot refund - showtime has already started',
          },
        });
      }
    }

    // Process refund through PayPal
    let refundResult;
    try {
      refundResult = await paypalService.processRefund(payment.paypalCaptureId);
    } catch (refundError: any) {
      console.error('PayPal refund error:', refundError);
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refund processing failed',
          details: refundError.message,
        },
      });
    }

    // Update payment
    payment.paymentStatus = 'refunded';
    payment.paypalRefundId = refundResult.refundId;
    payment.refundDate = new Date();
    await payment.save();

    // Update booking status
    if (booking) {
      booking.bookingStatus = 'cancelled';
      await booking.save();

      // Release seats
      const Seat = getSeatModel();
      if (Seat && booking.seatIds && booking.seatIds.length > 0) {
        await Seat.updateMany(
          { _id: { $in: booking.seatIds } },
          {
            status: 'available',
            heldBy: null,
            heldUntil: null,
          }
        );
      }
    }

    // Send refund confirmation email
    if (booking && req.user) {
      try {
        const populatedBooking = await Booking.findById(booking._id).populate({
          path: 'showtimeId',
          populate: [
            { path: 'movieId', select: 'title' },
            { path: 'cinemaId', select: 'name' },
          ],
        });
        await emailService.sendRefundConfirmation(
          populatedBooking as any,
          payment,
          req.user as any
        );
      } catch (emailError) {
        console.error('Failed to send refund email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        payment,
        refundId: refundResult.refundId,
        refundAmount: refundResult.amount,
        message: 'Refund processed successfully',
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to process refund' },
    });
  }
};

/* =======================
  6. Get All Payments (Admin)
======================= */

/**
 * Get all payments with filtering and pagination
 * - Admin only
 * - Supports filters: userId, status, startDate, endDate
 * - Supports pagination: page, limit
 */
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    // Admin only
    if (!isPlatformAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Admin access required' },
      });
    }

    // Parse query params
    const {
      userId: filterUserId,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    // Build query
    const query: any = {};

    if (filterUserId && mongoose.isValidObjectId(filterUserId as string)) {
      query.userId = filterUserId;
    }

    if (status) {
      query.paymentStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'firstName lastName email')
        .populate({
          path: 'bookingId',
          populate: [
            {
              path: 'showtimeId',
              populate: [
                { path: 'movieId', select: 'title' },
                { path: 'cinemaId', select: 'name' },
              ],
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch payments' },
    });
  }
};

/* =======================
  7. Cancel Payment
======================= */

/**
 * Cancel a pending payment when user cancels in PayPal
 * - Finds payment by PayPal order ID
 * - Updates payment and booking to cancelled
 * - Releases held seats
 */
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'PayPal order ID is required' },
      });
    }

    // Find payment by PayPal order ID
    const payment = await Payment.findByPayPalOrderId(orderId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found for this order' },
      });
    }

    // Verify payment belongs to current user
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to cancel this payment' },
      });
    }

    // Can only cancel pending payments
    if (payment.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot cancel ${payment.paymentStatus} payment`,
        },
      });
    }

    // Update payment status
    payment.paymentStatus = 'cancelled';
    await payment.save();

    // Update booking status and release seats
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.bookingStatus = 'cancelled';
      await booking.save();

      // Release seats
      const Seat = getSeatModel();
      if (Seat && booking.seatIds && booking.seatIds.length > 0) {
        await Seat.updateMany(
          { _id: { $in: booking.seatIds } },
          {
            status: 'available',
            heldBy: null,
            heldUntil: null,
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Payment cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel payment' },
    });
  }
};

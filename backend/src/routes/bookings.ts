// bookings.ts (Member 5)
// Booking routes - Defines API endpoints for booking-related operations
// Handles routes for creating bookings, viewing bookings, cancellations, and booking management

import { Router } from 'express';
import {
  createBooking,
  confirmBooking,
  getBookingById,
  getUserBookings,
  cancelBooking,
  getAllBookings,
} from '../controllers/bookingController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PROTECTED ROUTES (Authenticated Users)
// ============================================

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with pending status
 * @access  Private (Authenticated users)
 * @body    { showtimeId: string, seatIds: string[] }
 * @returns Booking with 10-minute hold time
 */
router.post('/bookings', authenticate, createBooking);

/**
 * @route   POST /api/bookings/:id/confirm
 * @desc    Confirm a booking after payment
 * @access  Private (Booking owner or Admin)
 * @body    { paymentId?: string }
 * @returns Confirmed booking with QR code
 */
router.post('/bookings/:id/confirm', authenticate, confirmBooking);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a specific booking by ID
 * @access  Private (Booking owner or Admin)
 * @returns Booking with all populated relations
 */
router.get('/bookings/:id', authenticate, getBookingById);

/**
 * @route   GET /api/users/me/bookings
 * @desc    Get all bookings for the current user
 * @access  Private (Authenticated users)
 * @query   status (optional): pending | confirmed | cancelled
 * @query   page (optional): page number for pagination
 * @query   limit (optional): items per page
 * @returns Array of bookings with pagination info
 */
router.get('/users/me/bookings', authenticate, getUserBookings);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel a booking (if showtime hasn't started)
 * @access  Private (Booking owner or Admin)
 * @returns Cancelled booking with refund required flag
 */
router.delete('/bookings/:id', authenticate, cancelBooking);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filters (Admin only)
 * @access  Private (Cinema Admin or Platform Admin)
 * @query   userId (optional): filter by user
 * @query   showtimeId (optional): filter by showtime
 * @query   status (optional): pending | confirmed | cancelled
 * @query   startDate (optional): filter from date
 * @query   endDate (optional): filter to date
 * @query   page (optional): page number for pagination
 * @query   limit (optional): items per page
 * @returns Array of bookings with pagination info
 */
router.get(
  '/bookings',
  authenticate,
  requireRole('cinema_admin', 'platform_admin'),
  getAllBookings
);

export default router;

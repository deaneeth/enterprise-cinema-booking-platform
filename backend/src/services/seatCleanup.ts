// seatCleanup.ts (Member 6)
// Scheduled job to clean up expired seat holds AND expire pending bookings
// Runs periodically to release seats and mark expired bookings

import mongoose from 'mongoose';
import websocketService from './websocket';
import auditService from './audit';
import Booking, { BookingDocument } from '../models/Booking';

// Cleanup interval in milliseconds (run every 30 seconds)
const CLEANUP_INTERVAL_MS = 30 * 1000;

// Booking expiry time in milliseconds (10 minutes)
const BOOKING_EXPIRY_MS = 10 * 60 * 1000;

const getSeatModel = () => {
  try {
    return mongoose.model('Seat');
  } catch {
    return null;
  }
};

const getPaymentModel = () => {
  try {
    return mongoose.model('Payment');
  } catch {
    return null;
  }
};

export const expirePendingBookings = async (): Promise<number> => {
  const Seat = getSeatModel();
  const Payment = getPaymentModel();
  const now = new Date();

  try {
    const expiredBookings = await Booking.find({
      bookingStatus: 'pending',
      expiresAt: { $lte: now },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    const bookingIds = expiredBookings.map((b) => b._id);
    const seatIdsToRelease: mongoose.Types.ObjectId[] = [];
    const showtimeIds = new Set<string>();

    for (const booking of expiredBookings) {
      if (booking.seatIds?.length > 0) {
        seatIdsToRelease.push(...booking.seatIds);
      }
      if (booking.showtimeId) {
        showtimeIds.add(booking.showtimeId.toString());
      }
    }

    const bookingResult = await Booking.updateMany(
      { _id: { $in: bookingIds }, bookingStatus: 'pending' },
      { $set: { bookingStatus: 'expired' } }
    );

    if (Seat && seatIdsToRelease.length > 0) {
      await Seat.updateMany(
        {
          _id: { $in: seatIdsToRelease },
          status: { $in: ['held', 'available'] },
        },
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

    // Cancel any pending payments for expired bookings
    if (Payment && bookingIds.length > 0) {
      const paymentResult = await Payment.updateMany(
        { bookingId: { $in: bookingIds }, paymentStatus: 'pending' },
        { $set: { paymentStatus: 'cancelled' } }
      );
      if (paymentResult.modifiedCount > 0) {
        console.log(
          `[Cleanup] Cancelled ${paymentResult.modifiedCount} pending payment(s) for expired bookings`
        );
      }
    }

    const expiredCount = bookingResult.modifiedCount || 0;

    if (expiredCount > 0) {
      console.log(`[Cleanup] Expired ${expiredCount} pending booking(s)`);
      for (const booking of expiredBookings) {
        auditService.logHoldExpired({
          bookingId: booking._id.toString(),
          showtimeId: booking.showtimeId?.toString() || 'unknown',
          seatIds: booking.seatIds?.map((id) => id.toString()) || [],
          trigger: 'cleanup_job',
        });
      }
      for (const showtimeId of showtimeIds) {
        websocketService.broadcastSeatsRefresh(showtimeId);
      }
    }

    return expiredCount;
  } catch (error) {
    console.error('[Cleanup] Error expiring pending bookings:', error);
    return 0;
  }
};

/**
 * Check and expire a specific booking if needed (Lazy Read)
 * - Checks if booking is pending and expired
 * - Updates status and releases seats if expired
 * - Returns the updated booking
 */
export const checkAndExpireBooking = async (
  booking: BookingDocument,
  trigger: string = 'read'
): Promise<BookingDocument> => {
  // Only check pending bookings
  if (booking.bookingStatus !== 'pending') {
    return booking;
  }

  const now = new Date();
  // Calculate expiry time with fallback
  const expiresAt = booking.expiresAt
    ? new Date(booking.expiresAt)
    : new Date(new Date(booking.createdAt).getTime() + BOOKING_EXPIRY_MS);

  // If not expired, return as is
  if (now <= expiresAt) {
    return booking;
  }

  try {
    console.log(
      `[Expiry] Expiring booking ${booking._id} via ${trigger} trigger`
    );

    // 1. Update booking status
    booking.bookingStatus = 'expired';
    await booking.save();

    // 2. Release seats (only if not already booked)
    const Seat = getSeatModel();
    if (Seat && booking.seatIds && booking.seatIds.length > 0) {
      await Seat.updateMany(
        { _id: { $in: booking.seatIds }, status: { $ne: 'booked' } },
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

    // 3. Broadcast WebSocket update
    if (booking.showtimeId) {
      const showtimeId = booking.showtimeId.toString();
      // We can broadcast refresh to be safe
      websocketService.broadcastSeatsRefresh(showtimeId);
    }

    // 4. Audit: Log the expiry event
    auditService.logHoldExpired({
      bookingId: booking._id.toString(),
      showtimeId: booking.showtimeId?.toString() || 'unknown',
      seatIds: booking.seatIds?.map((id) => id.toString()) || [],
      trigger: trigger as
        | 'payment_gate_create'
        | 'payment_gate_capture'
        | 'api_read'
        | 'cleanup_job'
        | 'user_action'
        | 'system',
    });

    return booking;
  } catch (error) {
    console.error(
      `[Lazy Expiry] Error expiring booking ${booking._id}:`,
      error
    );
    return booking; // Return original if error
  }
};

/**
 * Sync all seats from confirmed bookings (Startup repair job)
 * Ensures any seats that should be 'booked' (from confirmed bookings)
 * are actually marked as 'booked'. This permanently fixes data inconsistencies.
 */
export const syncAllConfirmedBookingSeats = async (): Promise<void> => {
  const Seat = getSeatModel();
  if (!Seat) {
    console.log('[SeatSync] Seat model not available, skipping startup sync');
    return;
  }

  try {
    console.log(
      '[SeatSync] Running startup seat sync for confirmed bookings...'
    );

    // Find all confirmed bookings with seat IDs
    const confirmedBookings = await Booking.find({
      bookingStatus: 'confirmed',
      seatIds: { $exists: true, $ne: [] },
    }).select('_id seatIds showtimeId');

    if (confirmedBookings.length === 0) {
      console.log('[SeatSync] No confirmed bookings found, sync complete');
      return;
    }

    let totalSeatsFixed = 0;

    // Process each confirmed booking
    for (const booking of confirmedBookings) {
      const result = await Seat.updateMany(
        {
          _id: { $in: booking.seatIds },
          status: { $ne: 'booked' }, // Only update seats not already marked as booked
        },
        {
          $set: {
            status: 'booked',
            bookingId: booking._id,
            heldBy: null,
            heldUntil: null,
          },
        }
      );

      if (result.modifiedCount > 0) {
        totalSeatsFixed += result.modifiedCount;
        console.log(
          `[SeatSync] Fixed ${result.modifiedCount} seats for booking ${booking._id}`
        );

        // Broadcast refresh for affected showtime
        if (booking.showtimeId) {
          websocketService.broadcastSeatsRefresh(booking.showtimeId.toString());
        }
      }
    }

    if (totalSeatsFixed > 0) {
      console.log(
        `[SeatSync] ✅ Startup sync complete: Fixed ${totalSeatsFixed} out-of-sync seats`
      );
    } else {
      console.log(
        '[SeatSync] ✅ Startup sync complete: All seats already in sync'
      );
    }
  } catch (error) {
    console.error('[SeatSync] Error during startup seat sync:', error);
  }
};

/**
 * Clean up stale pending payments (older than 1 hour)
 * These are payments that were created but never captured
 */
export const cleanupStalePayments = async (): Promise<number> => {
  const Payment = getPaymentModel();
  if (!Payment) return 0;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await Payment.updateMany(
      {
        paymentStatus: 'pending',
        createdAt: { $lt: oneHourAgo },
      },
      { $set: { paymentStatus: 'cancelled' } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[Cleanup] Cancelled ${result.modifiedCount} stale pending payment(s)`
      );
    }

    return result.modifiedCount || 0;
  } catch (error) {
    console.error('[Cleanup] Error cleaning up stale payments:', error);
    return 0;
  }
};

/**
 * Start the scheduled cleanup job
 * Returns the interval ID for cleanup if needed
 */
let cleanupIntervalId: NodeJS.Timeout | null = null;

export const startCleanupJob = (): void => {
  if (cleanupIntervalId) {
    console.log('[SeatCleanup] Cleanup job already running');
    return;
  }

  console.log('[Cleanup] Starting cleanup job (every 30s)');

  syncAllConfirmedBookingSeats();
  expirePendingBookings();

  cleanupIntervalId = setInterval(async () => {
    await expirePendingBookings();
    // Run stale payment cleanup less frequently (every 5 minutes)
    // Only run when interval count is a multiple of 10 (30s * 10 = 5 min)
  }, CLEANUP_INTERVAL_MS);

  // Separate interval for stale payment cleanup (every 5 minutes)
  setInterval(
    async () => {
      await cleanupStalePayments();
    },
    5 * 60 * 1000
  );
};

/**
 * Stop the scheduled cleanup job
 */
export const stopCleanupJob = (): void => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('[SeatCleanup] Cleanup job stopped');
  }
};

export default {
  expirePendingBookings,
  startCleanupJob,
  stopCleanupJob,
  checkAndExpireBooking,
  syncAllConfirmedBookingSeats,
  cleanupStalePayments,
};

// seatCleanup.ts (Member 6)
// Scheduled job to clean up expired seat holds AND expire pending bookings
// Runs periodically to release seats and mark expired bookings

import mongoose from 'mongoose';
import websocketService from './websocket';
import Booking from '../models/Booking';

// Cleanup interval in milliseconds (run every 30 seconds)
const CLEANUP_INTERVAL_MS = 30 * 1000;

// Booking expiry time in milliseconds (10 minutes)
const BOOKING_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Get Seat model dynamically
 */
const getSeatModel = () => {
  try {
    return mongoose.model('Seat');
  } catch {
    return null;
  }
};

/**
 * Clean up expired seat holds
 * - Finds all seats with status 'held' and heldUntil < now
 * - Updates them to 'available' and clears hold info
 * - Broadcasts WebSocket updates for real-time UI refresh
 */
export const cleanupExpiredHolds = async (): Promise<number> => {
  const Seat = getSeatModel();
  if (!Seat) {
    return 0;
  }

  const now = new Date();

  try {
    // Find all expired held seats
    const expiredSeats = await Seat.find({
      status: 'held',
      heldUntil: { $lt: now },
    });

    if (expiredSeats.length === 0) {
      return 0;
    }

    // Get showtime IDs for WebSocket notifications
    const showtimeIds = [
      ...new Set(
        expiredSeats.map((seat: { showtimeId: { toString: () => string } }) =>
          seat.showtimeId.toString()
        )
      ),
    ];

    // Update all expired seats to available
    const result = await Seat.updateMany(
      {
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

    const releasedCount = result.modifiedCount || 0;

    if (releasedCount > 0) {
      console.log(
        `[SeatCleanup] Released ${releasedCount} expired seat hold(s)`
      );

      // Broadcast WebSocket updates for each affected showtime
      for (const showtimeId of showtimeIds) {
        // Find the released seats for this showtime
        const releasedSeatsForShowtime = expiredSeats.filter(
          (seat: { showtimeId: { toString: () => string } }) =>
            seat.showtimeId.toString() === showtimeId
        );

        // Broadcast individual seat updates
        for (const seat of releasedSeatsForShowtime) {
          websocketService.broadcastSeatUpdate(showtimeId, {
            seatId: (
              seat as { _id: { toString: () => string } }
            )._id.toString(),
            status: 'available',
          });
        }

        // Broadcast seats refresh for the entire showtime
        websocketService.broadcastSeatsRefresh(showtimeId);
      }
    }

    return releasedCount;
  } catch (error) {
    console.error('[SeatCleanup] Error cleaning up expired holds:', error);
    return 0;
  }
};

/**
 * Expire pending bookings that are older than 10 minutes
 * - Finds pending bookings created more than 10 minutes ago
 * - Updates them to 'expired' status
 * - Releases their seats
 */
export const expirePendingBookings = async (): Promise<number> => {
  const Seat = getSeatModel();

  const expiryThreshold = new Date(Date.now() - BOOKING_EXPIRY_MS);

  try {
    // Find all pending bookings older than 10 minutes
    const expiredBookings = await Booking.find({
      bookingStatus: 'pending',
      createdAt: { $lt: expiryThreshold },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    // Collect all seat IDs from expired bookings
    const seatIdsToRelease: mongoose.Types.ObjectId[] = [];
    const showtimeIds = new Set<string>();

    for (const booking of expiredBookings) {
      if (booking.seatIds && booking.seatIds.length > 0) {
        seatIdsToRelease.push(...booking.seatIds);
      }
      if (booking.showtimeId) {
        showtimeIds.add(booking.showtimeId.toString());
      }
    }

    // Update all expired bookings to 'expired' status
    const bookingResult = await Booking.updateMany(
      {
        bookingStatus: 'pending',
        createdAt: { $lt: expiryThreshold },
      },
      {
        $set: { bookingStatus: 'expired' },
      }
    );

    // Release seats from expired bookings
    if (Seat && seatIdsToRelease.length > 0) {
      await Seat.updateMany(
        { _id: { $in: seatIdsToRelease } },
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

    const expiredCount = bookingResult.modifiedCount || 0;

    if (expiredCount > 0) {
      console.log(
        `[SeatCleanup] Expired ${expiredCount} pending booking(s) and released ${seatIdsToRelease.length} seat(s)`
      );

      // Broadcast WebSocket updates for affected showtimes
      for (const showtimeId of showtimeIds) {
        websocketService.broadcastSeatsRefresh(showtimeId);
      }
    }

    return expiredCount;
  } catch (error) {
    console.error('[SeatCleanup] Error expiring pending bookings:', error);
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

  console.log(
    '[SeatCleanup] Starting cleanup job (every 30s): seat holds + pending bookings'
  );

  // Run immediately on start
  cleanupExpiredHolds();
  expirePendingBookings();

  // Then run periodically
  cleanupIntervalId = setInterval(async () => {
    await cleanupExpiredHolds();
    await expirePendingBookings();
  }, CLEANUP_INTERVAL_MS);
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
  cleanupExpiredHolds,
  startCleanupJob,
  stopCleanupJob,
};

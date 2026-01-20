// websocket.ts (Member 5, 6)
// WebSocket service - Handles real-time communication for seat availability
// Manages WebSocket connections, broadcasts seat updates, and handles real-time booking notifications

import { Server, Socket } from 'socket.io';
import http from 'http';
import mongoose from 'mongoose';

/* =======================
  Seat Model Helper
  Note: Uses mongoose.model() to avoid import errors when Seat.ts is not yet implemented
  The actual Seat model will be created by Member 6
======================= */

const getSeatModel = () => {
  try {
    // Try to get the Seat model if it's been registered
    return mongoose.model('Seat');
  } catch {
    // Model not registered yet - will work once Member 6 implements Seat.ts
    return null;
  }
};

/* =======================
  Types and Interfaces
======================= */

interface SeatHoldData {
  showtimeId: string;
  seatId: string;
  userId: string;
}

interface SeatReleaseData {
  showtimeId: string;
  seatId: string;
}

interface BookingCreateData {
  showtimeId: string;
  cinemaId: string;
  bookingData: {
    bookingId: string;
    userId: string;
    seatIds: string[];
    totalAmount: number;
    [key: string]: unknown;
  };
}

interface BookingCancelData {
  showtimeId: string;
  seatIds: string[];
}

interface SeatUpdatePayload {
  seatId: string;
  status: 'available' | 'held' | 'booked';
  heldBy?: string;
  heldUntil?: string;
}

/* =======================
  Seat Hold Timer Storage
======================= */

// Store for tracking held seats with their auto-release timers
const seatHoldTimers: Map<string, NodeJS.Timeout> = new Map();

// Seat hold duration: 10 minutes in milliseconds
const SEAT_HOLD_DURATION_MS = 10 * 60 * 1000;

/* =======================
  WebSocket Service Class
======================= */

class WebSocketService {
  private io: Server | null = null;
  private isInitialized = false;

  /**
   * Initialize the WebSocket server with the HTTP server
   * @param server - HTTP server instance from Express
   */
  initialize(server: http.Server): void {
    if (this.isInitialized) {
      console.warn('WebSocket service already initialized');
      return;
    }

    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    this.isInitialized = true;
    console.log('WebSocket service initialized');
  }

  /**
   * Get the Socket.io server instance
   * @returns Server instance or null if not initialized
   */
  getIO(): Server | null {
    return this.io;
  }

  /**
   * Setup all WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // ========== JOIN/LEAVE ROOM EVENTS ==========

      // User joins showtime room (for real-time seat updates)
      socket.on('join:showtime', (showtimeId: string) => {
        if (!showtimeId) {
          socket.emit('error', { message: 'Showtime ID is required' });
          return;
        }
        socket.join(`showtime:${showtimeId}`);
        console.log(`User ${socket.id} joined showtime room: ${showtimeId}`);
      });

      // User leaves showtime room
      socket.on('leave:showtime', (showtimeId: string) => {
        if (!showtimeId) return;
        socket.leave(`showtime:${showtimeId}`);
        console.log(`User ${socket.id} left showtime room: ${showtimeId}`);
      });

      // Cinema admin joins their cinema room (for booking notifications)
      socket.on('join:cinema:admin', (cinemaId: string) => {
        if (!cinemaId) {
          socket.emit('error', { message: 'Cinema ID is required' });
          return;
        }
        socket.join(`cinema:admin:${cinemaId}`);
        console.log(`Admin ${socket.id} joined cinema room: ${cinemaId}`);
      });

      // ========== SEAT HOLD/RELEASE EVENTS ==========

      // User holds a seat (10-minute temporary hold)
      socket.on('seat:hold', async (data: SeatHoldData) => {
        try {
          const { showtimeId, seatId, userId } = data;

          // Validate required fields
          if (!showtimeId || !seatId || !userId) {
            socket.emit('error', {
              message: 'Missing required fields for seat hold',
            });
            return;
          }

          // Get Seat model and update if available
          const Seat = getSeatModel();
          if (Seat) {
            // Update seat status in DB to 'held'
            await Seat.findByIdAndUpdate(seatId, {
              status: 'held',
              heldBy: userId,
              heldUntil: new Date(Date.now() + SEAT_HOLD_DURATION_MS),
            });
          }

          // Broadcast to all users in the showtime room
          this.io?.to(`showtime:${showtimeId}`).emit('seat:updated', {
            seatId,
            status: 'held',
            heldBy: userId,
          } as SeatUpdatePayload);

          // Clear any existing timer for this seat
          const existingTimer = seatHoldTimers.get(seatId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Set auto-release timer (10 minutes)
          const timerId = setTimeout(async () => {
            await this.releaseSeat(showtimeId, seatId);
            seatHoldTimers.delete(seatId);
            console.log(`Seat ${seatId} auto-released after timeout`);
          }, SEAT_HOLD_DURATION_MS);

          // Store timer reference for potential early cancellation
          seatHoldTimers.set(seatId, timerId);

          console.log(
            `Seat ${seatId} held by user ${userId} for showtime ${showtimeId}`
          );
        } catch (error) {
          console.error('Error holding seat:', error);
          socket.emit('error', { message: 'Failed to hold seat' });
        }
      });

      // User releases held seat
      socket.on('seat:release', async (data: SeatReleaseData) => {
        try {
          const { showtimeId, seatId } = data;

          // Validate required fields
          if (!showtimeId || !seatId) {
            socket.emit('error', {
              message: 'Missing required fields for seat release',
            });
            return;
          }

          await this.releaseSeat(showtimeId, seatId);

          // Clear the auto-release timer if it exists
          const timerId = seatHoldTimers.get(seatId);
          if (timerId) {
            clearTimeout(timerId);
            seatHoldTimers.delete(seatId);
          }

          console.log(`Seat ${seatId} released for showtime ${showtimeId}`);
        } catch (error) {
          console.error('Error releasing seat:', error);
          socket.emit('error', { message: 'Failed to release seat' });
        }
      });

      // ========== BOOKING EVENTS ==========

      // Booking created - notify cinema admin
      socket.on('booking:create', (data: BookingCreateData) => {
        try {
          const { cinemaId, bookingData } = data;

          if (!cinemaId || !bookingData) {
            socket.emit('error', {
              message: 'Missing required fields for booking notification',
            });
            return;
          }

          // Notify cinema admin of new booking
          this.io
            ?.to(`cinema:admin:${cinemaId}`)
            .emit('booking:confirmed', bookingData);

          console.log(`Booking notification sent to cinema admin: ${cinemaId}`);
        } catch (error) {
          console.error('Error notifying booking:', error);
          socket.emit('error', { message: 'Failed to notify booking' });
        }
      });

      // User cancels booking - release all seats
      socket.on('booking:cancel', async (data: BookingCancelData) => {
        try {
          const { showtimeId, seatIds } = data;

          if (!showtimeId || !seatIds || !Array.isArray(seatIds)) {
            socket.emit('error', {
              message: 'Missing required fields for booking cancellation',
            });
            return;
          }

          // Release all seats and broadcast updates
          for (const seatId of seatIds) {
            await this.releaseSeat(showtimeId, seatId);

            // Clear any hold timers
            const timerId = seatHoldTimers.get(seatId);
            if (timerId) {
              clearTimeout(timerId);
              seatHoldTimers.delete(seatId);
            }
          }

          console.log(
            `Booking cancelled - ${seatIds.length} seats released for showtime ${showtimeId}`
          );
        } catch (error) {
          console.error('Error cancelling booking:', error);
          socket.emit('error', { message: 'Failed to cancel booking' });
        }
      });

      // ========== DISCONNECT EVENT ==========

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Note: Held seats will auto-release via timers
        // Could add cleanup of held seats by socket.id if needed
      });
    });
  }

  /* =======================
    Helper Methods
  ======================= */

  /**
   * Release a single seat - update DB and broadcast
   * @param showtimeId - The showtime ID
   * @param seatId - The seat ID to release
   */
  private async releaseSeat(showtimeId: string, seatId: string): Promise<void> {
    const Seat = getSeatModel();
    if (Seat) {
      const result = await Seat.findOneAndUpdate(
        { _id: seatId, status: 'held' },
        {
          status: 'available',
          heldBy: null,
          heldUntil: null,
        },
        { new: true }
      );
      if (!result) {
        return;
      }
    }

    this.io?.to(`showtime:${showtimeId}`).emit('seat:updated', {
      seatId,
      status: 'available',
    } as SeatUpdatePayload);
  }

  /* =======================
    Broadcast Methods (for use by controllers)
  ======================= */

  /**
   * Broadcast seat update to all users in showtime room
   * @param showtimeId - The showtime ID
   * @param seatData - Seat update data
   */
  broadcastSeatUpdate(showtimeId: string, seatData: SeatUpdatePayload): void {
    this.io?.to(`showtime:${showtimeId}`).emit('seat:updated', seatData);
  }

  /**
   * Broadcast signal to refresh all seats (triggers client to refetch)
   * @param showtimeId - The showtime ID
   */
  broadcastSeatsRefresh(showtimeId: string): void {
    this.io?.to(`showtime:${showtimeId}`).emit('seats:refresh');
  }

  /**
   * Broadcast booking confirmed to showtime room
   * @param showtimeId - The showtime ID
   * @param bookingData - Booking details
   */
  broadcastBookingConfirmed(
    showtimeId: string,
    bookingData: Record<string, unknown>
  ): void {
    this.io
      ?.to(`showtime:${showtimeId}`)
      .emit('booking:confirmed', bookingData);
  }

  /**
   * Broadcast showtime availability update
   * @param showtimeId - The showtime ID
   * @param showtimeData - Updated showtime data
   */
  broadcastShowtimeUpdated(
    showtimeId: string,
    showtimeData: Record<string, unknown>
  ): void {
    this.io
      ?.to(`showtime:${showtimeId}`)
      .emit('showtime:updated', showtimeData);
  }

  /**
   * Notify cinema admins of new booking (for dashboard)
   * @param cinemaId - The cinema ID
   * @param bookingData - Booking details
   */
  notifyCinemaAdmin(
    cinemaId: string,
    bookingData: Record<string, unknown>
  ): void {
    this.io
      ?.to(`cinema:admin:${cinemaId}`)
      .emit('booking:confirmed', bookingData);
  }

  /**
   * Broadcast error to a specific room
   * @param room - Room name to broadcast error to
   * @param errorMessage - Error message to send
   */
  broadcastError(room: string, errorMessage: string): void {
    this.io?.to(room).emit('error', { message: errorMessage });
  }

  /**
   * Get the number of active hold timers (for monitoring)
   */
  getActiveHoldTimersCount(): number {
    return seatHoldTimers.size;
  }

  /**
   * Clear a specific seat hold timer
   * @param seatId - The seat ID
   */
  clearSeatHoldTimer(seatId: string): void {
    const timerId = seatHoldTimers.get(seatId);
    if (timerId) {
      clearTimeout(timerId);
      seatHoldTimers.delete(seatId);
    }
  }
}

// Export singleton instance
export default new WebSocketService();

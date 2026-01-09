// seatController.ts (Member 6)
// Seat controller - Contains business logic for seat-related operations
// Handles seat availability checking, seat selection, and seat status management
import { Request, Response } from 'express';
import SeatModel, { SeatDocument } from '../models/Seat';
import ShowtimeModel from '../models/Showtime';
import websocketService from '../services/websocket';

/* =======================
  Seat Controller Class
======================= */
export class SeatController {
  /**
   * Generate seats for a showtime
   * Called when a new showtime is created
   *
   * @param req - Express request
   * @param res - Express response
   */
  static async generateSeats(req: Request, res: Response): Promise<void> {
    try {
      const { showtimeId, totalSeats = 100, layout } = req.body;

      if (!showtimeId) {
        res.status(400).json({
          success: false,
          error: { message: 'Showtime ID is required' },
        });
        return;
      }

      // Check if showtime exists
      const showtime = await ShowtimeModel.findById(showtimeId);
      if (!showtime) {
        res.status(404).json({
          success: false,
          error: { message: 'Showtime not found' },
        });
        return;
      }

      // Check if seats already exist for this showtime
      const existingSeats = await SeatModel.findOne({ showtimeId });
      if (existingSeats) {
        res.status(400).json({
          success: false,
          error: { message: 'Seats already generated for this showtime' },
        });
        return;
      }

      // Generate seats using the static method from the model
      const generatedSeats = await (SeatModel as any).generateSeatsForShowtime(
        showtimeId,
        totalSeats,
        layout
      );

      res.status(201).json({
        success: true,
        data: {
          showtimeId,
          seatCount: generatedSeats.length,
          seats: generatedSeats,
        },
      });
    } catch (error) {
      console.error('Error generating seats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate seats' },
      });
    }
  }

  /**
   * Get all seats for a showtime grouped by row
   * Releases expired holds before returning
   *
   * @param req - Express request with showtimeId param
   * @param res - Express response
   */
  static async getSeatsForShowtime(req: Request, res: Response): Promise<void> {
    try {
      const { showtimeId } = req.params;

      if (!showtimeId) {
        res.status(400).json({
          success: false,
          error: { message: 'Showtime ID is required' },
        });
        return;
      }

      // Check if showtime exists
      const showtime = await ShowtimeModel.findById(showtimeId);
      if (!showtime) {
        res.status(404).json({
          success: false,
          error: { message: 'Showtime not found' },
        });
        return;
      }

      // Release expired holds
      await SeatController.releaseExpiredHolds(showtimeId);

      // Fetch all seats for the showtime
      const seats = await SeatModel.find({ showtimeId }).sort({ row: 1, column: 1 });

      if (seats.length === 0) {
        res.status(404).json({
          success: false,
          error: { message: 'No seats found for this showtime' },
        });
        return;
      }

      // Group seats by row
      const seatsByRow: { [key: string]: SeatDocument[] } = {};
      seats.forEach((seat) => {
        if (!seatsByRow[seat.row]) {
          seatsByRow[seat.row] = [];
        }
        seatsByRow[seat.row].push(seat);
      });

      res.status(200).json({
        success: true,
        data: {
          showtimeId,
          totalSeats: seats.length,
          rows: Object.keys(seatsByRow).sort(),
          seats: seatsByRow,
          allSeats: seats,
        },
      });
    } catch (error) {
      console.error('Error fetching seats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch seats' },
      });
    }
  }

  /**
   * Hold a seat temporarily (10 minutes)
   * Used when user selects a seat during booking
   *
   * @param req - Express request with userId and seatId
   * @param res - Express response
   */
  static async holdSeat(req: Request, res: Response): Promise<void> {
    try {
      const { seatId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User authentication required' },
        });
        return;
      }

      if (!seatId) {
        res.status(400).json({
          success: false,
          error: { message: 'Seat ID is required' },
        });
        return;
      }

      const seat = await SeatModel.findById(seatId);
      if (!seat) {
        res.status(404).json({
          success: false,
          error: { message: 'Seat not found' },
        });
        return;
      }

      // Check if seat is available
      if (!seat.isAvailable()) {
        res.status(400).json({
          success: false,
          error: {
            message: `Seat is ${seat.status} and cannot be held`,
          },
        });
        return;
      }

      // Set hold
      seat.status = 'held';
      seat.heldBy = userId;
      seat.heldUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      await seat.save();

      // Emit WebSocket event to notify other clients
      websocketService?.broadcastSeatUpdate(
        seat.showtimeId.toString(),
        {
          seatId: seat._id.toString(),
          status: 'held',
          heldBy: userId,
        }
      );

      // Schedule auto-release after 10 minutes
      setTimeout(
        () => {
          SeatController.autoReleaseSeat(seatId);
        },
        10 * 60 * 1000
      );

      res.status(200).json({
        success: true,
        data: seat,
      });
    } catch (error) {
      console.error('Error holding seat:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to hold seat' },
      });
    }
  }

  /**
   * Release a held seat
   * Used when user deselects a seat or hold expires
   *
   * @param req - Express request with seatId
   * @param res - Express response
   */
  static async releaseSeat(req: Request, res: Response): Promise<void> {
    try {
      const { seatId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { message: 'User authentication required' },
        });
        return;
      }

      if (!seatId) {
        res.status(400).json({
          success: false,
          error: { message: 'Seat ID is required' },
        });
        return;
      }

      const seat = await SeatModel.findById(seatId);
      if (!seat) {
        res.status(404).json({
          success: false,
          error: { message: 'Seat not found' },
        });
        return;
      }

      // Verify seat is held by this user
      if (seat.status !== 'held' || seat.heldBy?.toString() !== userId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Seat is not held by you',
          },
        });
        return;
      }

      // Release seat
      seat.status = 'available';
      seat.heldBy = undefined;
      seat.heldUntil = undefined;

      await seat.save();

      // Emit WebSocket event
      websocketService?.broadcastSeatUpdate(
        seat.showtimeId.toString(),
        {
          seatId: seat._id.toString(),
          status: 'available',
        }
      );

      res.status(200).json({
        success: true,
        data: seat,
      });
    } catch (error) {
      console.error('Error releasing seat:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to release seat' },
      });
    }
  }

  /**
   * Book multiple seats (called internally by booking controller)
   * Updates seat status from available/held to booked
   *
   * @param req - Express request with seatIds and bookingId
   * @param res - Express response
   */
  static async bookSeats(req: Request, res: Response): Promise<void> {
    try {
      const { seatIds, bookingId } = req.body;

      if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Valid seat IDs array is required' },
        });
        return;
      }

      if (!bookingId) {
        res.status(400).json({
          success: false,
          error: { message: 'Booking ID is required' },
        });
        return;
      }

      // Update all seats
      const updatedSeats = await Promise.all(
        seatIds.map(async (seatId: string) => {
          const seat = await SeatModel.findById(seatId);
          if (!seat) {
            throw new Error(`Seat ${seatId} not found`);
          }

          seat.status = 'booked';
          seat.bookingId = bookingId;
          seat.heldBy = undefined;
          seat.heldUntil = undefined;

          return seat.save();
        })
      );

      // Get showtime ID from first seat to emit event
      const showtimeId = updatedSeats[0].showtimeId.toString();

      // Emit WebSocket event to refresh all seats in showtime room
      updatedSeats.forEach((seat) => {
        websocketService?.broadcastSeatUpdate(
          showtimeId,
          {
            seatId: seat._id.toString(),
            status: 'booked',
          }
        );
      });

      res.status(200).json({
        success: true,
        data: {
          bookedSeatsCount: updatedSeats.length,
          seats: updatedSeats,
        },
      });
    } catch (error) {
      console.error('Error booking seats:', error);
      res.status(500).json({
        success: false,
        error: {
          message: `Failed to book seats: ${(error as Error).message}`,
        },
      });
    }
  }

  /**
   * Release expired holds (background job)
   * Called periodically to clean up expired seat holds
   *
   * @param showtimeId - Optional: only release for specific showtime
   */
  static async releaseExpiredHolds(showtimeId?: string): Promise<void> {
    try {
      const query: any = {
        status: 'held',
        heldUntil: { $lt: new Date() },
      };

      if (showtimeId) {
        query.showtimeId = showtimeId;
      }

      const expiredSeats = await SeatModel.find(query);

      for (const seat of expiredSeats) {
        seat.status = 'available';
        seat.heldBy = undefined;
        seat.heldUntil = undefined;
        await seat.save();

        // Emit WebSocket event
        websocketService?.broadcastSeatUpdate(
          seat.showtimeId.toString(),
          {
            seatId: seat._id.toString(),
            status: 'available',
          }
        );
      }

      if (expiredSeats.length > 0) {
        console.log(`Released ${expiredSeats.length} expired seat holds`);
      }
    } catch (error) {
      console.error('Error releasing expired holds:', error);
    }
  }

  /**
   * Auto-release a seat after hold expiration
   * Private method called via setTimeout
   *
   * @param seatId - Seat ID to release
   */
  private static async autoReleaseSeat(seatId: string): Promise<void> {
    try {
      const seat = await SeatModel.findById(seatId);
      if (!seat || seat.status !== 'held') {
        return;
      }

      if (!seat.isExpired()) {
        return; // Hold not expired yet
      }

      seat.status = 'available';
      seat.heldBy = undefined;
      seat.heldUntil = undefined;
      await seat.save();

      // Emit WebSocket event
      websocketService?.broadcastSeatUpdate(
        seat.showtimeId.toString(),
        {
          seatId: seat._id.toString(),
          status: 'available',
        }
      );

      console.log(`Auto-released expired seat hold: ${seatId}`);
    } catch (error) {
      console.error('Error auto-releasing seat:', error);
    }
  }
}

export default SeatController;
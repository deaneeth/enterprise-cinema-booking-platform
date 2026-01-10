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
   * Get all seats with filters and pagination (Admin only)
   * Supports filtering by showtimeId, status, seatType
   *
   * @param req - Express request with query params
   * @param res - Express response
   */
  static async getAllSeats(req: Request, res: Response): Promise<void> {
    try {
      const { showtimeId, status, seatType, page = 1, limit = 100 } = req.query;

      // Build query filter
      const query: Record<string, unknown> = {};
      if (showtimeId) query.showtimeId = showtimeId;
      if (status) query.status = status;
      if (seatType) query.seatType = seatType;

      // Calculate pagination
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(limit as string, 10))
      );
      const skip = (pageNum - 1) * limitNum;

      // Fetch seats with pagination
      const [seats, total] = await Promise.all([
        SeatModel.find(query)
          .populate('showtimeId', 'movieId cinemaId startTime date')
          .sort({ showtimeId: 1, row: 1, column: 1 })
          .skip(skip)
          .limit(limitNum),
        SeatModel.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: seats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching all seats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch seats' },
      });
    }
  }

  /**
   * Get single seat by ID
   * Checks for expired hold and releases it
   *
   * @param req - Express request with seat ID param
   * @param res - Express response
   */
  static async getSeatById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'Seat ID is required' },
        });
        return;
      }

      const seat = await SeatModel.findById(id).populate(
        'showtimeId',
        'movieId cinemaId startTime date price screenNumber'
      );

      if (!seat) {
        res.status(404).json({
          success: false,
          error: { message: 'Seat not found' },
        });
        return;
      }

      // Check for expired hold and release it
      if (seat.status === 'held' && seat.isExpired()) {
        seat.status = 'available';
        seat.heldBy = undefined;
        seat.heldUntil = undefined;
        await seat.save();

        // Emit WebSocket event
        websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
          seatId: seat._id.toString(),
          status: 'available',
        });
      }

      res.status(200).json({
        success: true,
        data: seat,
      });
    } catch (error) {
      console.error('Error fetching seat:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to fetch seat' },
      });
    }
  }

  /**
   * Book a single seat (internal use by booking flow)
   * Updates seat status to 'booked' and sets bookingId
   *
   * @param req - Express request with seat ID and booking ID
   * @param res - Express response
   */
  static async bookSeat(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { bookingId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'Seat ID is required' },
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

      const seat = await SeatModel.findById(id);
      if (!seat) {
        res.status(404).json({
          success: false,
          error: { message: 'Seat not found' },
        });
        return;
      }

      // Check if seat can be booked (must be available or held)
      if (seat.status === 'booked') {
        res.status(400).json({
          success: false,
          error: { message: 'Seat is already booked' },
        });
        return;
      }

      // Update seat status to booked
      seat.status = 'booked';
      seat.bookingId = bookingId;
      seat.heldBy = undefined;
      seat.heldUntil = undefined;

      await seat.save();

      // Emit WebSocket event
      websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
        seatId: seat._id.toString(),
        status: 'booked',
      });

      res.status(200).json({
        success: true,
        data: seat,
      });
    } catch (error) {
      console.error('Error booking seat:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to book seat' },
      });
    }
  }

  /**
   * Reset all seats for a showtime (Admin only)
   * Sets all seats back to 'available' status
   * Used for showtime cancellation or testing
   *
   * @param req - Express request with showtime ID
   * @param res - Express response
   */
  static async resetSeatsForShowtime(
    req: Request,
    res: Response
  ): Promise<void> {
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

      // Reset all seats for this showtime
      const result = await SeatModel.updateMany(
        { showtimeId },
        {
          $set: {
            status: 'available',
            heldBy: null,
            heldUntil: null,
            bookingId: null,
          },
        }
      );

      // Emit WebSocket event to refresh all seats
      websocketService?.broadcastSeatsRefresh(showtimeId);

      res.status(200).json({
        success: true,
        data: {
          showtimeId,
          resetCount: result.modifiedCount,
          message: `${result.modifiedCount} seats reset to available`,
        },
      });
    } catch (error) {
      console.error('Error resetting seats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to reset seats' },
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
      const seats = await SeatModel.find({ showtimeId }).sort({
        row: 1,
        column: 1,
      });

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
      const seatId = req.params.id;
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
      websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
        seatId: seat._id.toString(),
        status: 'held',
        heldBy: userId,
      });

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
      const seatId = req.params.id;
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
      websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
        seatId: seat._id.toString(),
        status: 'available',
      });

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
        websocketService?.broadcastSeatUpdate(showtimeId, {
          seatId: seat._id.toString(),
          status: 'booked',
        });
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
        websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
          seatId: seat._id.toString(),
          status: 'available',
        });
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
      websocketService?.broadcastSeatUpdate(seat.showtimeId.toString(), {
        seatId: seat._id.toString(),
        status: 'available',
      });

      console.log(`Auto-released expired seat hold: ${seatId}`);
    } catch (error) {
      console.error('Error auto-releasing seat:', error);
    }
  }
}

export default SeatController;

// seats.ts (Member 6)
// Seat routes - Defines API endpoints for seat-related operations
// Handles routes for getting available seats, seat selection, and seat status updates
import { Router, Request, Response } from 'express';
import SeatController from '../controllers/seatController';
import { authenticate } from '../middlewares/auth';

/* =======================
  Router Setup
======================= */
const router = Router();

/* =======================
  Public Routes
======================= */

/**
 * GET /api/seats/showtime/:showtimeId
 * Get all seats for a showtime (grouped by row)
 * Public route - no authentication required
 */
router.get('/showtime/:showtimeId', SeatController.getSeatsForShowtime);

/* =======================
  Protected Routes (User)
======================= */

/**
 * PUT /api/seats/:seatId/hold
 * Hold a seat temporarily (10 minutes)
 * User must be authenticated
 */
router.put(
  '/:seatId/hold',
  authenticate,
  (req: Request, res: Response) => {
    SeatController.holdSeat(req, res);
  }
);

/**
 * PUT /api/seats/:seatId/release
 * Release a held seat
 * User must be authenticated
 */
router.put(
  '/:seatId/release',
  authenticate,
  (req: Request, res: Response) => {
    SeatController.releaseSeat(req, res);
  }
);

/* =======================
  Admin/Internal Routes
======================= */

/**
 * POST /api/seats/generate
 * Generate seats for a showtime
 * Internal route - called by booking flow
 */
router.post('/generate', (req: Request, res: Response) => {
  SeatController.generateSeats(req, res);
});

/**
 * POST /api/seats/book
 * Book multiple seats (update status to booked)
 * Internal route - called by booking controller
 */
router.post('/book', (req: Request, res: Response) => {
  SeatController.bookSeats(req, res);
});

export default router;
// seats.ts (Member 6)
// Seat routes - Defines API endpoints for seat-related operations
// Handles routes for getting available seats, seat selection, and seat status updates
import { Router, Request, Response } from 'express';
import SeatController from '../controllers/seatController';
import { authenticate, requireRole } from '../middlewares/auth';

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
 * GET /api/seats/:id
 * Get single seat by ID
 * User must be authenticated
 */
router.get('/:id', authenticate, (req: Request, res: Response) => {
  SeatController.getSeatById(req, res);
});

/**
 * PUT /api/seats/:id/hold
 * Hold a seat temporarily (10 minutes)
 * User must be authenticated
 */
router.put('/:id/hold', authenticate, (req: Request, res: Response) => {
  SeatController.holdSeat(req, res);
});

/**
 * PUT /api/seats/:id/release
 * Release a held seat
 * User must be authenticated
 */
router.put('/:id/release', authenticate, (req: Request, res: Response) => {
  SeatController.releaseSeat(req, res);
});

/**
 * PUT /api/seats/:id/book
 * Book a single seat (internal use by booking flow)
 * User must be authenticated
 */
router.put('/:id/book', authenticate, (req: Request, res: Response) => {
  SeatController.bookSeat(req, res);
});

/* =======================
  Admin Routes (platform_admin, cinema_admin)
======================= */

/**
 * GET /api/seats
 * Get all seats with filters and pagination
 * Admin only (platform_admin or cinema_admin)
 */
router.get(
  '/',
  authenticate,
  requireRole('platform_admin', 'cinema_admin'),
  (req: Request, res: Response) => {
    SeatController.getAllSeats(req, res);
  }
);

/**
 * POST /api/seats/generate
 * Generate seats for a showtime
 * Admin only (platform_admin or cinema_admin)
 */
router.post(
  '/generate',
  authenticate,
  requireRole('platform_admin', 'cinema_admin'),
  (req: Request, res: Response) => {
    SeatController.generateSeats(req, res);
  }
);

/**
 * POST /api/seats/book
 * Book multiple seats (update status to booked)
 * Internal route - called by booking controller (authenticated)
 */
router.post('/book', authenticate, (req: Request, res: Response) => {
  SeatController.bookSeats(req, res);
});

/**
 * DELETE /api/seats/reset/:showtimeId
 * Reset all seats for a showtime to available
 * Admin only (platform_admin or cinema_admin)
 */
router.delete(
  '/reset/:showtimeId',
  authenticate,
  requireRole('platform_admin', 'cinema_admin'),
  (req: Request, res: Response) => {
    SeatController.resetSeatsForShowtime(req, res);
  }
);

export default router;

// showtimes.ts (Member 4)
// Showtime routes - Defines API endpoints for showtime-related operations
// Handles routes for listing showtimes, filtering by cinema/movie, and showtime management

import { Router } from 'express';
import {
  createShowtime,
  getAllShowtimes,
  getShowtimeById,
  updateShowtime,
  deleteShowtime,
  getShowtimesByMovie,
  getShowtimesByCinema,
} from '../controllers/showtimeController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/showtimes
 * @desc    Get all showtimes with optional filters: movieId, cinemaId, date, format
 * @access  Public
 */
router.get('/showtimes', getAllShowtimes);

/**
 * @route   GET /api/showtimes/:id
 * @desc    Get showtime by ID
 * @access  Public
 */
router.get('/showtimes/:id', getShowtimeById);

// /**
//  * @route   GET /api/movies/:movieId/showtimes
//  * @desc    Get all showtimes for a movie (optional date range filter)
//  * @access  Public
//  */
// router.get('/movies/:movieId/showtimes', getShowtimesByMovie);

/**
 * @route   GET /api/cinemas/:cinemaId/showtimes
 * @desc    Get all showtimes for a cinema (optional date filter)
 * @access  Public
 */
router.get('/cinemas/:cinemaId/showtimes', getShowtimesByCinema);

// ============================================
// PROTECTED ROUTES (Cinema Admin)
// ============================================

/**
 * @route   POST /api/showtimes
 * @desc    Create a new showtime
 * @access  Private (Cinema Admin only)
 */
router.post(
  '/showtimes',
  authenticate,
  requireRole('cinema_admin', 'platform_admin'),
  createShowtime
);

/**
 * @route   PUT /api/showtimes/:id
 * @desc    Update a showtime
 * @access  Private (Cinema Admin only)
 */
router.put(
  '/showtimes/:id',
  authenticate,
  requireRole('cinema_admin', 'platform_admin'),
  updateShowtime
);

/**
 * @route   DELETE /api/showtimes/:id
 * @desc    Soft delete a showtime (set isActive=false)
 * @access  Private (Cinema Admin only)
 */
router.delete(
  '/showtimes/:id',
  authenticate,
  requireRole('cinema_admin', 'platform_admin'),
  deleteShowtime
);

export default router;

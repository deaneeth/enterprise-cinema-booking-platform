// cinemas.ts (Member 2)
// Cinema routes - Defines API endpoints for cinema-related operations
// Handles routes for listing cinemas, getting cinema details, and cinema management

import { Router } from 'express';
import {
  createCinema,
  deleteCinema,
  getAllCinemas,
  getCinemaById,
  searchCinemas,
  updateCinema,
} from '../controllers/cinemaController';
import { getCinemaReviews } from '../controllers/reviewController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/cinemas
 * @desc    Get all cinemas (optional filters)
 * @access  Public
 */
router.get('/cinemas', getAllCinemas);

/**
 * @route   GET /api/cinemas/search?q=<term>
 * @desc    Search cinemas by name or city
 * @access  Public
 */
router.get('/cinemas/search', searchCinemas);

/**
 * @route   GET /api/cinemas/:id
 * @desc    Get cinema by ID
 * @access  Public
 */
router.get('/cinemas/:id', getCinemaById);

/**
 * @route   GET /api/cinemas/:id/reviews
 * @desc    Get all reviews for a cinema
 * @access  Public
 */
router.get('/cinemas/:id/reviews', getCinemaReviews);

// ============================================
// PROTECTED ROUTES
// ============================================

/**
 * @route   POST /api/cinemas
 * @desc    Create a new cinema
 * @access  Private (Platform Admin only)
 */
router.post(
  '/cinemas',
  authenticate,
  requireRole('platform_admin'),
  createCinema
);

/**
 * @route   PUT /api/cinemas/:id
 * @desc    Update a cinema
 * @access  Private (Cinema Admin of that cinema OR Platform Admin)
 */
router.put(
  '/cinemas/:id',
  authenticate,
  requireRole('cinema_admin', 'platform_admin'),
  updateCinema
);

/**
 * @route   DELETE /api/cinemas/:id
 * @desc    Soft delete a cinema (set isActive=false)
 * @access  Private (Platform Admin only)
 */
router.delete(
  '/cinemas/:id',
  authenticate,
  requireRole('platform_admin'),
  deleteCinema
);

export default router;

// movies.ts (Member 3)
// Movie routes - Defines API endpoints for movie-related operations
// Handles routes for listing movies, searching, filtering, and getting movie details

import { Router } from 'express';
import {
  createMovie,
  deleteMovie,
  getAllMovies,
  getMovieById,
  searchMovies,
  updateMovie,
} from '../controllers/movieController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/movies
 * @desc    Get all movies (filters: genre, language, rating, q)
 * @access  Public
 */
router.get('/movies', getAllMovies);

/**
 * @route   GET /api/movies/search?q=<term>
 * @desc    Text search movies by title
 * @access  Public
 */
router.get('/movies/search', searchMovies);

/**
 * @route   GET /api/movies/:id
 * @desc    Get movie by ID
 * @access  Public
 */
router.get('/movies/:id', getMovieById);

// ============================================
// PROTECTED ROUTES (Platform Admin)
// ============================================

/**
 * @route   POST /api/movies
 * @desc    Create a new movie
 * @access  Private (Platform Admin only)
 */
router.post('/movies', authenticate, requireRole('platform_admin'), createMovie);

/**
 * @route   PUT /api/movies/:id
 * @desc    Update a movie
 * @access  Private (Platform Admin only)
 */
router.put('/movies/:id', authenticate, requireRole('platform_admin'), updateMovie);

/**
 * @route   DELETE /api/movies/:id
 * @desc    Soft delete a movie (set isActive=false)
 * @access  Private (Platform Admin only)
 */
router.delete('/movies/:id', authenticate, requireRole('platform_admin'), deleteMovie);

export default router;


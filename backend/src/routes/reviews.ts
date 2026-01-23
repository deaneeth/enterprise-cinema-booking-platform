// reviews.ts (Member 8)
// Review routes - Defines API endpoints for review-related operations
// Handles routes for submitting reviews, getting movie reviews, and review management

import { Router } from 'express';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with optional filters (targetType, targetId, rating)
 * @access  Public
 */
router.get('/reviews', getReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review by ID
 * @access  Public
 */
router.get('/reviews/:id', getReviewById);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   POST /api/reviews
 * @desc    Create a new review for a movie or cinema
 * @access  Private (Authenticated users)
 */
router.post('/reviews', authenticate, createReview);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update an existing review (own review only)
 * @access  Private (Owner only)
 */
router.put('/reviews/:id', authenticate, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (soft delete)
 * @access  Private (Owner or Admin)
 */
router.delete('/reviews/:id', authenticate, deleteReview);

export default router;

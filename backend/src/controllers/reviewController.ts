// reviewController.ts (Member 8)
// Review controller - Contains business logic for review-related operations
// Handles review submission, retrieval, moderation, and rating calculations

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review, { TargetType, TARGET_TYPES } from '../models/Review';
import Movie from '../models/Movie';
import Cinema from '../models/Cinema';
import Booking from '../models/Booking';

// Import to ensure Express Request type is extended with user property
import '../middlewares/auth';

/* =======================
  Helper Functions
======================= */

// Validate ObjectId
const isValidObjectId = (id: unknown): id is string => {
  return typeof id === 'string' && mongoose.isValidObjectId(id);
};

// Check if user is admin (platform or cinema)
const isAdmin = (req: Request): boolean => {
  return (
    req.user?.role === 'platform_admin' || req.user?.role === 'cinema_admin'
  );
};

// Get user ID from request
const getUserId = (req: Request): string | undefined => {
  return req.user?.id?.toString();
};

/**
 * Check if user has a verified booking for a movie or cinema
 * A verified booking means the user has a confirmed booking for a showtime
 * that includes the target movie or is at the target cinema
 */
const checkVerifiedBooking = async (
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<boolean> => {
  try {
    const Showtime = mongoose.model('Showtime');

    // Find showtimes for the target
    const showtimeQuery: Record<string, unknown> =
      targetType === 'movie'
        ? { movieId: new mongoose.Types.ObjectId(targetId) }
        : { cinemaId: new mongoose.Types.ObjectId(targetId) };

    const showtimeIds = await Showtime.find(showtimeQuery).distinct('_id');

    if (showtimeIds.length === 0) {
      return false;
    }

    // Check if user has a confirmed booking for any of these showtimes
    const confirmedBooking = await Booking.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      showtimeId: { $in: showtimeIds },
      bookingStatus: 'confirmed',
    });

    return !!confirmedBooking;
  } catch (error) {
    console.error('Error checking verified booking:', error);
    return false;
  }
};

/**
 * Update the average rating on the Movie or Cinema document
 * Called after create, update, or delete review operations
 * @param targetType - 'movie' or 'cinema'
 * @param targetId - The ID of the movie or cinema
 * @returns The new average rating and total reviews
 */
const updateTargetAverageRating = async (
  targetType: TargetType,
  targetId: string | mongoose.Types.ObjectId
): Promise<{ averageRating: number; totalReviews: number }> => {
  try {
    // Get the calculated average from Review model
    const { averageRating, totalReviews } = await Review.getAverageRating(
      targetId,
      targetType
    );

    // Update the target document with the new average
    if (targetType === 'movie') {
      await Movie.findByIdAndUpdate(targetId, {
        averageRating,
        totalReviews,
      });
    } else {
      await Cinema.findByIdAndUpdate(targetId, {
        averageRating,
        totalReviews,
      });
    }

    return { averageRating, totalReviews };
  } catch (error) {
    console.error('Error updating target average rating:', error);
    // Return zeros if update fails - don't throw to prevent breaking the main operation
    return { averageRating: 0, totalReviews: 0 };
  }
};

/* =======================
  1. Create Review
======================= */

/**
 * Create a new review for a movie or cinema
 * POST /api/reviews
 */
export const createReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'User ID not found' },
      });
      return;
    }

    const { targetType, targetId, rating, comment } = req.body;

    // Validate targetType
    if (!targetType || !TARGET_TYPES.includes(targetType)) {
      res.status(400).json({
        success: false,
        error: { message: 'targetType must be either "movie" or "cinema"' },
      });
      return;
    }

    // Validate targetId
    if (!isValidObjectId(targetId)) {
      res.status(400).json({
        success: false,
        error: { message: 'Valid targetId is required' },
      });
      return;
    }

    // Validate rating
    const ratingNum = Number(rating);
    if (
      !rating ||
      !Number.isFinite(ratingNum) ||
      ratingNum < 1 ||
      ratingNum > 5
    ) {
      res.status(400).json({
        success: false,
        error: { message: 'Rating must be a number between 1 and 5' },
      });
      return;
    }

    // Check target exists
    if (targetType === 'movie') {
      const movie = await Movie.findById(targetId);
      if (!movie || !movie.isActive) {
        res.status(404).json({
          success: false,
          error: { message: 'Movie not found' },
        });
        return;
      }
    } else {
      const cinema = await Cinema.findById(targetId);
      if (!cinema || !cinema.isActive) {
        res.status(404).json({
          success: false,
          error: { message: 'Cinema not found' },
        });
        return;
      }
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        error: { message: 'You have already reviewed this item' },
      });
      return;
    }

    // Check if user has a verified booking
    const isVerifiedBooking = await checkVerifiedBooking(
      userId,
      targetType as TargetType,
      targetId
    );

    // Create review
    const review = await Review.create({
      userId: new mongoose.Types.ObjectId(userId),
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      rating: Math.round(ratingNum), // Ensure integer
      comment: comment ? String(comment).trim() : undefined,
      isVerifiedBooking,
      isActive: true,
    });

    // Populate user info for response
    await review.populate('userId', 'firstName lastName');

    // Update target average rating
    await updateTargetAverageRating(targetType as TargetType, targetId);

    res.status(201).json({
      success: true,
      data: { review },
      message: 'Review created successfully',
    });
  } catch (error: unknown) {
    console.error('Create review error:', error);

    // Handle duplicate key error
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      res.status(409).json({
        success: false,
        error: { message: 'You have already reviewed this item' },
      });
      return;
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error creating review' },
    });
  }
};

/* =======================
  2. Get Reviews
======================= */

/**
 * Get all reviews with optional filters
 * GET /api/reviews
 * Query params: targetType, targetId, rating, page, limit
 */
export const getReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { targetType, targetId, rating } = req.query;

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // Build filter
    const filter: Record<string, unknown> = { isActive: true };

    if (targetType && TARGET_TYPES.includes(targetType as TargetType)) {
      filter.targetType = targetType;
    }

    if (targetId && isValidObjectId(targetId)) {
      filter.targetId = new mongoose.Types.ObjectId(targetId);
    }

    if (rating) {
      const ratingNum = parseInt(String(rating), 10);
      if (ratingNum >= 1 && ratingNum <= 5) {
        filter.rating = ratingNum;
      }
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching reviews' },
    });
  }
};

/* =======================
  3. Get Review By ID
======================= */

/**
 * Get a single review by ID
 * GET /api/reviews/:id
 */
export const getReviewById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid review ID' },
      });
      return;
    }

    const review = await Review.findById(id).populate(
      'userId',
      'firstName lastName'
    );

    if (!review || !review.isActive) {
      res.status(404).json({
        success: false,
        error: { message: 'Review not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching review' },
    });
  }
};

/* =======================
  4. Update Review
======================= */

/**
 * Update an existing review (own review only)
 * PUT /api/reviews/:id
 */
export const updateReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'User ID not found' },
      });
      return;
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid review ID' },
      });
      return;
    }

    const review = await Review.findById(id);

    if (!review || !review.isActive) {
      res.status(404).json({
        success: false,
        error: { message: 'Review not found' },
      });
      return;
    }

    // Check if user owns the review
    if (!review.canEdit(userId)) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only update your own reviews' },
      });
      return;
    }

    const { rating, comment } = req.body;

    // Update rating if provided
    if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        res.status(400).json({
          success: false,
          error: { message: 'Rating must be a number between 1 and 5' },
        });
        return;
      }
      review.rating = Math.round(ratingNum);
    }

    // Update comment if provided
    if (comment !== undefined) {
      review.comment = comment ? String(comment).trim() : undefined;
    }

    await review.save();

    // Populate user info for response
    await review.populate('userId', 'firstName lastName');

    // Update target average rating if rating was changed
    if (rating !== undefined) {
      await updateTargetAverageRating(
        review.targetType as TargetType,
        review.targetId.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: { review },
      message: 'Review updated successfully',
    });
  } catch (error: unknown) {
    console.error('Update review error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error updating review' },
    });
  }
};

/* =======================
  5. Delete Review
======================= */

/**
 * Delete a review (soft delete)
 * User can delete own review, admin can delete any
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: 'User ID not found' },
      });
      return;
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid review ID' },
      });
      return;
    }

    const review = await Review.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        error: { message: 'Review not found' },
      });
      return;
    }

    if (!review.isActive) {
      res.status(409).json({
        success: false,
        error: { message: 'Review is already deleted' },
      });
      return;
    }

    // Check if user owns the review or is admin
    const canDelete = review.canEdit(userId) || isAdmin(req);
    if (!canDelete) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only delete your own reviews' },
      });
      return;
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    // Update target average rating
    await updateTargetAverageRating(
      review.targetType as TargetType,
      review.targetId.toString()
    );

    res.status(200).json({
      success: true,
      data: { review },
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error deleting review' },
    });
  }
};

/* =======================
  6. Get Movie Reviews
======================= */

/**
 * Get all reviews for a specific movie with average rating
 * GET /api/movies/:id/reviews
 */
export const getMovieReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid movie ID' },
      });
      return;
    }

    // Check movie exists
    const movie = await Movie.findById(id);
    if (!movie || !movie.isActive) {
      res.status(404).json({
        success: false,
        error: { message: 'Movie not found' },
      });
      return;
    }

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Get reviews
    const reviews = await Review.find({
      targetType: 'movie',
      targetId: new mongoose.Types.ObjectId(id),
      isActive: true,
    })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get average rating
    const { averageRating, totalReviews } = await Review.getAverageRating(
      id,
      'movie'
    );

    const pages = Math.max(1, Math.ceil(totalReviews / limit));

    res.status(200).json({
      success: true,
      data: {
        movie: {
          _id: movie._id,
          title: movie.title,
        },
        averageRating,
        totalReviews,
        reviews,
        pagination: { page, limit, total: totalReviews, pages },
      },
    });
  } catch (error) {
    console.error('Get movie reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching movie reviews' },
    });
  }
};

/* =======================
  7. Get Cinema Reviews
======================= */

/**
 * Get all reviews for a specific cinema with average rating
 * GET /api/cinemas/:id/reviews
 */
export const getCinemaReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid cinema ID' },
      });
      return;
    }

    // Check cinema exists
    const cinema = await Cinema.findById(id);
    if (!cinema || !cinema.isActive) {
      res.status(404).json({
        success: false,
        error: { message: 'Cinema not found' },
      });
      return;
    }

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Get reviews
    const reviews = await Review.find({
      targetType: 'cinema',
      targetId: new mongoose.Types.ObjectId(id),
      isActive: true,
    })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get average rating
    const { averageRating, totalReviews } = await Review.getAverageRating(
      id,
      'cinema'
    );

    const pages = Math.max(1, Math.ceil(totalReviews / limit));

    res.status(200).json({
      success: true,
      data: {
        cinema: {
          _id: cinema._id,
          name: cinema.name,
        },
        averageRating,
        totalReviews,
        reviews,
        pagination: { page, limit, total: totalReviews, pages },
      },
    });
  } catch (error) {
    console.error('Get cinema reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching cinema reviews' },
    });
  }
};

/* =======================
  8. Get User Reviews
======================= */

/**
 * Get all reviews by a specific user
 * GET /api/users/:id/reviews
 */
export const getUserReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid user ID' },
      });
      return;
    }

    // Users can only see their own reviews, admins can see any
    const requesterId = getUserId(req);
    if (id !== requesterId && !isAdmin(req)) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only view your own reviews' },
      });
      return;
    }

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Get reviews
    const reviews = await Review.find({
      userId: new mongoose.Types.ObjectId(id),
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate target info (movie or cinema title)
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        let targetInfo: { _id: unknown; title?: string; name?: string } | null =
          null;

        if (review.targetType === 'movie') {
          const movie = await Movie.findById(review.targetId)
            .select('title')
            .lean();
          if (movie) {
            targetInfo = { _id: movie._id, title: movie.title };
          }
        } else if (review.targetType === 'cinema') {
          const cinema = await Cinema.findById(review.targetId)
            .select('name')
            .lean();
          if (cinema) {
            targetInfo = { _id: cinema._id, name: cinema.name };
          }
        }

        return {
          ...review,
          target: targetInfo,
        };
      })
    );

    const total = await Review.countDocuments({
      userId: new mongoose.Types.ObjectId(id),
      isActive: true,
    });
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        reviews: populatedReviews,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching user reviews' },
    });
  }
};

/* =======================
  Export Controller
======================= */

export default {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getMovieReviews,
  getCinemaReviews,
  getUserReviews,
};

// Review.ts (Member 8)
// Review model - Defines the review schema/entity for movie and cinema reviews
// Handles review data structure including user, target (movie/cinema), rating, and comments

import mongoose, { Document, Schema, Model } from 'mongoose';

/* =======================
  Constants
======================= */
export const TARGET_TYPES = ['movie', 'cinema'] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

/* =======================
  Review Document Interface
======================= */
export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: TargetType;
  targetId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  isVerifiedBooking: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canEdit(userId: string | mongoose.Types.ObjectId): boolean;
}

/* =======================
  Review Model Interface (with statics)
======================= */
export interface IReviewModel extends Model<IReview> {
  getAverageRating(
    targetId: string | mongoose.Types.ObjectId,
    targetType: TargetType
  ): Promise<{ averageRating: number; totalReviews: number }>;
}

/* =======================
  Review Schema
======================= */
const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    targetType: {
      type: String,
      enum: {
        values: TARGET_TYPES,
        message: 'Target type must be either movie or cinema',
      },
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
      refPath: 'targetType',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isVerifiedBooking: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =======================
  Virtuals for Population
======================= */

// Virtual populate for user details
ReviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Dynamic reference based on targetType
ReviewSchema.virtual('target', {
  refPath: 'targetType',
  localField: 'targetId',
  foreignField: '_id',
  justOne: true,
});

/* =======================
  Instance Methods
======================= */

/**
 * Checks if the given user can edit this review
 * Only the review owner can edit their review
 * @param userId - The ID of the user attempting to edit
 * @returns boolean - true if the user can edit
 */
ReviewSchema.methods.canEdit = function (
  userId: string | mongoose.Types.ObjectId
): boolean {
  const reviewUserId = this.userId.toString();
  const checkUserId =
    userId instanceof mongoose.Types.ObjectId ? userId.toString() : userId;
  return reviewUserId === checkUserId;
};

/* =======================
  Static Methods
======================= */

/**
 * Calculates the average rating for a movie or cinema
 * Only includes active reviews in the calculation
 * @param targetId - The ID of the movie or cinema
 * @param targetType - The type of target ('movie' or 'cinema')
 * @returns Object containing averageRating and totalReviews
 */
ReviewSchema.statics.getAverageRating = async function (
  targetId: string | mongoose.Types.ObjectId,
  targetType: TargetType
): Promise<{ averageRating: number; totalReviews: number }> {
  const objectId =
    typeof targetId === 'string'
      ? new mongoose.Types.ObjectId(targetId)
      : targetId;

  const result = await this.aggregate([
    {
      $match: {
        targetId: objectId,
        targetType: targetType,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: result[0].totalReviews,
  };
};

/* =======================
  Indexes
======================= */

// Unique compound index: one review per user per target
// Ensures a user can only review a movie/cinema once
ReviewSchema.index(
  { userId: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    name: 'unique_user_target_review',
  }
);

// Index for fetching reviews by target (most common query)
ReviewSchema.index({ targetType: 1, targetId: 1, isActive: 1 });

// Index for fetching user's reviews
ReviewSchema.index({ userId: 1, createdAt: -1 });

// Index for sorting by rating
ReviewSchema.index({ targetType: 1, targetId: 1, rating: -1 });

/* =======================
  Model Export
======================= */

const Review = mongoose.model<IReview, IReviewModel>('Review', ReviewSchema);

export default Review;

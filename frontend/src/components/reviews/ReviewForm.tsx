// ReviewForm.tsx (Member 8)
// Form component for creating and editing reviews
// Supports star rating selection and comment input

import React, { useState, useEffect } from "react";
import StarRating from "./StarRating";
import api, { ApiResponse, getErrorMessage } from "../../services/api";
import { Review } from "../../types/Review";

interface ReviewFormProps {
  targetType: "movie" | "cinema";
  targetId: string;
  existingReview?: Review;
  onSubmit: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  targetType,
  targetId,
  existingReview,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifiedBooking, setIsVerifiedBooking] = useState(false);

  const isEditMode = !!existingReview;

  // Check if user has a verified booking (for display purposes)
  useEffect(() => {
    if (existingReview) {
      setIsVerifiedBooking(existingReview.isVerifiedBooking);
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && existingReview) {
        // Update existing review
        await api.put<ApiResponse>(`/api/reviews/${existingReview._id}`, {
          rating,
          comment: comment.trim() || undefined,
        });
      } else {
        // Create new review
        await api.post<ApiResponse>("/api/reviews", {
          targetType,
          targetId,
          rating,
          comment: comment.trim() || undefined,
        });
      }

      onSubmit();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/5 p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-white">
        {isEditMode ? "Edit Your Review" : "Write a Review"}
      </h3>

      {/* Rating Selection */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Your Rating <span className="text-red-400">*</span>
        </label>
        <StarRating
          rating={rating}
          size="large"
          interactive={true}
          onChange={setRating}
        />
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}
      </div>

      {/* Comment Input */}
      <div className="mb-4">
        <label
          htmlFor="comment"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          Your Review (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          maxLength={1000}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white text-sm placeholder-gray-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        />
        <p className="mt-1 text-xs text-gray-500">
          {comment.length}/1000 characters
        </p>
      </div>

      {/* Verified Booking Badge */}
      {isVerifiedBooking && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2.5">
          <svg
            className="h-4 w-4 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-green-400">Verified Booking</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : isEditMode
              ? "Update Review"
              : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;

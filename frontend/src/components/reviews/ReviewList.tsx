// ReviewList.tsx (Member 8)
// Displays a list of reviews for a movie or cinema
// Includes average rating, pagination, sorting, and filtering

import React, { useEffect, useState, useCallback } from "react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import api, { ApiResponse, getErrorMessage } from "../../services/api";
import { Review, ReviewsResponse } from "../../types/Review";

interface ReviewListProps {
  targetType: "movie" | "cinema";
  targetId: string;
}

type SortOption = "recent" | "highest" | "lowest";
type RatingFilter = 0 | 1 | 2 | 3 | 4 | 5;

const ReviewList: React.FC<ReviewListProps> = ({ targetType, targetId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Sorting and filtering
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(0);

  // User's existing review
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("token");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        targetType === "movie"
          ? `/api/movies/${targetId}/reviews`
          : `/api/cinemas/${targetId}/reviews`;

      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (ratingFilter > 0) {
        params.rating = ratingFilter;
      }

      const res = await api.get<ApiResponse<ReviewsResponse>>(endpoint, {
        params,
      });
      const data = res.data.data;

      if (data) {
        let fetchedReviews = data.reviews || [];

        // Client-side sorting (API returns by createdAt desc by default)
        if (sortBy === "highest") {
          fetchedReviews = [...fetchedReviews].sort(
            (a, b) => b.rating - a.rating,
          );
        } else if (sortBy === "lowest") {
          fetchedReviews = [...fetchedReviews].sort(
            (a, b) => a.rating - b.rating,
          );
        }

        setReviews(fetchedReviews);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
        setTotalPages(data.pagination?.pages || 1);

        // Find user's review if logged in
        if (isLoggedIn) {
          const userId = getUserIdFromToken();
          if (userId) {
            const existingReview = fetchedReviews.find(
              (r) => r.userId._id === userId,
            );
            setUserReview(existingReview || null);
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, page, limit, ratingFilter, sortBy, isLoggedIn]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Helper to extract user ID from token (basic JWT decode)
  const getUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload.userId || null;
    } catch {
      return null;
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    fetchReviews();
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await api.delete(`/api/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Average Rating */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">Reviews</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="medium" showValue />
              <span className="text-sm text-gray-400">
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>

        {/* Write Review Button */}
        {isLoggedIn && !userReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          targetType={targetType}
          targetId={targetId}
          existingReview={editingReview || undefined}
          onSubmit={handleReviewSubmitted}
          onCancel={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* Filters and Sorting */}
      {totalReviews > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort reviews"
            className="rounded-lg border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="recent" className="bg-[#1a1a2e]">Most Recent</option>
            <option value="highest" className="bg-[#1a1a2e]">Highest Rating</option>
            <option value="lowest" className="bg-[#1a1a2e]">Lowest Rating</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(Number(e.target.value) as RatingFilter);
              setPage(1);
            }}
            aria-label="Filter by rating"
            className="rounded-lg border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value={0} className="bg-[#1a1a2e]">All Ratings</option>
            <option value={5} className="bg-[#1a1a2e]">5 Stars</option>
            <option value={4} className="bg-[#1a1a2e]">4+ Stars</option>
            <option value={3} className="bg-[#1a1a2e]">3+ Stars</option>
            <option value={2} className="bg-[#1a1a2e]">2+ Stars</option>
            <option value={1} className="bg-[#1a1a2e]">1+ Stars</option>
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400">
                {ratingFilter > 0
                  ? "No reviews match this filter"
                  : "No reviews yet. Be the first to review!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isOwnReview = userReview?._id === review._id;
                const userName = `${review.userId.firstName} ${review.userId.lastName}`;

                return (
                  <div
                    key={review._id}
                    className={`rounded-xl border p-5 transition-colors ${
                      isOwnReview
                        ? "border-red-500/30 bg-red-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {/* Review Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* User Avatar */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-sm font-medium text-red-400">
                          {review.userId.firstName.charAt(0)}
                          {review.userId.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {userName}
                            </span>
                            {review.isVerifiedBooking && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                                <svg
                                  className="h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Verified
                              </span>
                            )}
                            {isOwnReview && (
                              <span className="text-xs text-red-400">
                                (Your Review)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={review.rating} size="small" />
                            <span className="text-xs text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit/Delete Buttons */}
                      {isOwnReview && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditReview(review)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Review Comment */}
                    {review.comment && (
                      <p className="text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewList;

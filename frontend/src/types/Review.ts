// Review.ts (Member 8)
// Review type definition for frontend

export interface Review {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  targetType: "movie" | "cinema";
  targetId: string;
  rating: number;
  comment?: string;
  isVerifiedBooking: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated target info (for user reviews)
  target?: {
    _id: string;
    title?: string; // For movies
    name?: string; // For cinemas
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  averageRating?: number;
  totalReviews?: number;
  movie?: {
    _id: string;
    title: string;
  };
  cinema?: {
    _id: string;
    name: string;
  };
}

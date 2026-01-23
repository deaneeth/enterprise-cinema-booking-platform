// Movie.ts (Member 3)
// Movie model - Defines the movie schema/entity for film information
// Handles movie data structure including title, description, genre, duration, and ratings

import mongoose, { Document, Schema } from 'mongoose';

// Allowed values - exported for reuse in controller
export const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
] as const;
export const LANGUAGES = ['English', 'Sinhala', 'Tamil'] as const;
export const RATINGS = ['G', 'PG', 'PG-13', 'R'] as const;

export interface IMovie extends Document {
  title: string;
  description?: string;
  genre: string[];
  language?: string;
  duration?: number; // minutes
  releaseDate?: Date;
  rating?: string;
  posterUrl?: string;
  trailerUrl?: string;
  cast: string[];
  director?: string;
  isActive: boolean;
  averageRating: number; // User review average (1-5)
  totalReviews: number; // Total number of user reviews
  createdAt: Date;
  updatedAt: Date;
  formatDuration(): string;
}

const MovieSchema: Schema<IMovie> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    genre: {
      type: [String],
      enum: GENRES as unknown as string[],
      default: [],
    },
    language: {
      type: String,
      enum: LANGUAGES as unknown as string[],
    },
    duration: {
      type: Number,
      min: [0, 'Duration must be >= 0'],
    },
    releaseDate: {
      type: Date,
    },
    rating: {
      type: String,
      enum: RATINGS as unknown as string[],
    },
    posterUrl: {
      type: String,
      trim: true,
    },
    trailerUrl: {
      type: String,
      trim: true,
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating must be >= 0'],
      max: [5, 'Average rating must be <= 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews must be >= 0'],
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search on title
MovieSchema.index({ title: 'text' });

// Instance methods
MovieSchema.methods.formatDuration = function (): string {
  const dur = this.duration;
  if (typeof dur !== 'number' || !Number.isFinite(dur) || dur < 0) return '0m';

  const hours = Math.floor(dur / 60);
  const minutes = Math.floor(dur % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const Movie = mongoose.model<IMovie>('Movie', MovieSchema);

export default Movie;

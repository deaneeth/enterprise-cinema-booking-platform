// Movie.ts
// Shared Movie type definition for frontend components
// This type should match the backend Movie model structure

export interface Movie {
  _id: string;
  title: string;
  description?: string;
  genre?: string[];
  language?: string;
  duration?: number;
  releaseDate?: string;
  rating?: string;
  posterUrl?: string;
  trailerUrl?: string;
  cast?: string[];
  director?: string;
  isActive?: boolean;
}

// constants.ts
// Shared constants for movie-related enums
// These values should match the backend Movie model

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
] as const;

export const LANGUAGES = ["English", "Sinhala", "Tamil"] as const;

export const RATINGS = ["G", "PG", "PG-13", "R"] as const;

export type Genre = (typeof GENRES)[number];
export type Language = (typeof LANGUAGES)[number];
export type Rating = (typeof RATINGS)[number];

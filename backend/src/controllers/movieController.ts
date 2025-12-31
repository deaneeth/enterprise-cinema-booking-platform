// movieController.ts (Member 3)
// Movie controller - Contains business logic for movie-related operations
// Handles movie listing, searching, filtering, details retrieval, and movie management

// Movie controller - CRUD and search operations for movies

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Movie from '../models/Movie';

const GENRES = [
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
];
const LANGUAGES = ['English', 'Sinhala', 'Tamil'];
const RATINGS = ['G', 'PG', 'PG-13', 'R'];

const isValidObjectId = (id: unknown): id is string => {
  return typeof id === 'string' && mongoose.isValidObjectId(id);
};

const parseCommaList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value))
    return value
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

export const createMovie = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }
    if (req.user.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Platform admin only.' },
      });
      return;
    }

    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      rating,
      posterUrl,
      trailerUrl,
      cast,
      director,
      isActive,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Title is required' } });
      return;
    }

    const genreArray = parseCommaList(genre).filter((g) => GENRES.includes(g));
    if (
      genre &&
      genreArray.length === 0 &&
      Array.isArray(genre) &&
      genre.length > 0
    ) {
      res.status(400).json({
        success: false,
        error: { message: `genre must be one of: ${GENRES.join(', ')}` },
      });
      return;
    }

    if (
      language !== undefined &&
      language !== null &&
      !LANGUAGES.includes(String(language))
    ) {
      res.status(400).json({
        success: false,
        error: {
          message: `language must be one of: ${LANGUAGES.join(', ')}`,
        },
      });
      return;
    }

    if (
      rating !== undefined &&
      rating !== null &&
      !RATINGS.includes(String(rating))
    ) {
      res.status(400).json({
        success: false,
        error: { message: `rating must be one of: ${RATINGS.join(', ')}` },
      });
      return;
    }

    const durationNum =
      duration !== undefined && duration !== null
        ? Number(duration)
        : undefined;
    if (
      durationNum !== undefined &&
      (!Number.isFinite(durationNum) || durationNum < 0)
    ) {
      res.status(400).json({
        success: false,
        error: { message: 'duration must be a non-negative number' },
      });
      return;
    }

    let release: Date | undefined;
    if (releaseDate !== undefined && releaseDate !== null) {
      const d = new Date(releaseDate);
      if (Number.isNaN(d.getTime())) {
        res
          .status(400)
          .json({ success: false, error: { message: 'Invalid releaseDate' } });
        return;
      }
      release = d;
    }

    const castArray = parseCommaList(cast);

    const movie = await Movie.create({
      title: title.trim(),
      description:
        typeof description === 'string' ? description.trim() : undefined,
      genre: genreArray,
      language: language ? String(language) : undefined,
      duration: durationNum,
      releaseDate: release,
      rating: rating ? String(rating) : undefined,
      posterUrl: posterUrl ? String(posterUrl).trim() : undefined,
      trailerUrl: trailerUrl ? String(trailerUrl).trim() : undefined,
      cast: castArray,
      director: director ? String(director).trim() : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });

    res.status(201).json({ success: true, data: { movie } });
  } catch (error: unknown) {
    console.error('Create movie error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res
        .status(400)
        .json({ success: false, error: { message: error.message } });
      return;
    }
    res.status(500).json({
      success: false,
      error: { message: 'Server error creating movie' },
    });
  }
};

export const getAllMovies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { genre, language, rating, q } = req.query;
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const filter: Record<string, unknown> = { isActive: true };

    const genres = parseCommaList(genre).filter((g) => GENRES.includes(g));
    if (genres.length > 0) filter.genre = { $in: genres };

    if (language && typeof language === 'string') {
      if (LANGUAGES.includes(language)) filter.language = language;
      else {
        res.status(400).json({
          success: false,
          error: {
            message: `language must be one of: ${LANGUAGES.join(', ')}`,
          },
        });
        return;
      }
    }

    if (rating && typeof rating === 'string') {
      if (RATINGS.includes(rating)) filter.rating = rating;
      else {
        res.status(400).json({
          success: false,
          error: { message: `rating must be one of: ${RATINGS.join(', ')}` },
        });
        return;
      }
    }

    if (q && typeof q === 'string' && q.trim()) {
      // simple case-insensitive substring search on title
      const term = q.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      filter['title'] = { $regex: term, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const movies = await Movie.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Movie.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        movies,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Get all movies error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching movies' },
    });
  }
};

export const getMovieById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Invalid movie id' } });
      return;
    }

    const movie = await Movie.findById(id);
    if (!movie || !movie.isActive) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Movie not found' } });
      return;
    }

    res.status(200).json({ success: true, data: { movie } });
  } catch (error) {
    console.error('Get movie by id error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching movie' },
    });
  }
};

export const updateMovie = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }
    if (req.user.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Platform admin only.' },
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Invalid movie id' } });
      return;
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Movie not found' } });
      return;
    }

    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      rating,
      posterUrl,
      trailerUrl,
      cast,
      director,
      isActive,
    } = req.body;

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        res.status(400).json({
          success: false,
          error: { message: 'title must be a non-empty string' },
        });
        return;
      }
      movie.title = title.trim();
    }

    if (description !== undefined)
      movie.description =
        typeof description === 'string' ? description.trim() : undefined;

    if (genre !== undefined) {
      const genreArray = parseCommaList(genre).filter((g) =>
        GENRES.includes(g)
      );
      movie.genre = genreArray;
    }

    if (language !== undefined) {
      if (language !== null && !LANGUAGES.includes(String(language))) {
        res.status(400).json({
          success: false,
          error: {
            message: `language must be one of: ${LANGUAGES.join(', ')}`,
          },
        });
        return;
      }
      movie.language = language ? String(language) : undefined;
    }

    if (duration !== undefined) {
      const durationNum = duration !== null ? Number(duration) : undefined;
      if (
        durationNum !== undefined &&
        (!Number.isFinite(durationNum) || durationNum < 0)
      ) {
        res.status(400).json({
          success: false,
          error: { message: 'duration must be a non-negative number' },
        });
        return;
      }
      movie.duration = durationNum;
    }

    if (releaseDate !== undefined) {
      if (releaseDate === null) movie.releaseDate = undefined;
      else {
        const d = new Date(releaseDate);
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({
            success: false,
            error: { message: 'Invalid releaseDate' },
          });
          return;
        }
        movie.releaseDate = d;
      }
    }

    if (rating !== undefined) {
      if (rating !== null && !RATINGS.includes(String(rating))) {
        res.status(400).json({
          success: false,
          error: { message: `rating must be one of: ${RATINGS.join(', ')}` },
        });
        return;
      }
      movie.rating = rating ? String(rating) : undefined;
    }

    if (posterUrl !== undefined)
      movie.posterUrl = posterUrl ? String(posterUrl).trim() : undefined;
    if (trailerUrl !== undefined)
      movie.trailerUrl = trailerUrl ? String(trailerUrl).trim() : undefined;
    if (cast !== undefined) movie.cast = parseCommaList(cast);
    if (director !== undefined)
      movie.director = director ? String(director).trim() : undefined;
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          error: { message: 'isActive must be a boolean' },
        });
        return;
      }
      movie.isActive = isActive;
    }

    await movie.save();
    res.status(200).json({ success: true, data: { movie } });
  } catch (error: unknown) {
    console.error('Update movie error:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res
        .status(400)
        .json({ success: false, error: { message: error.message } });
      return;
    }
    res.status(500).json({
      success: false,
      error: { message: 'Server error updating movie' },
    });
  }
};

export const deleteMovie = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }
    if (req.user.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Platform admin only.' },
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Invalid movie id' } });
      return;
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Movie not found' } });
      return;
    }

    if (!movie.isActive) {
      res.status(409).json({
        success: false,
        error: { message: 'Movie is already inactive' },
      });
      return;
    }

    movie.isActive = false;
    await movie.save();

    res.status(200).json({ success: true, data: { movie } });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error deleting movie' },
    });
  }
};

export const searchMovies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q } = req.query;
    if (typeof q !== 'string' || !q.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'q query parameter is required' },
      });
      return;
    }

    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const term = q.trim();
    const filter: Record<string, unknown> = {
      $text: { $search: term },
      isActive: true,
    };

    const skip = (page - 1) * limit;
    const movies = await Movie.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    const total = await Movie.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        movies,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Search movies error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error searching movies' },
    });
  }
};

/**
 * Get all showtimes for a specific movie
 * GET /api/movies/:id/showtimes
 * Note: Depends on Showtime model (Member 4)
 */
export const getMovieShowtimes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Invalid movie id' } });
      return;
    }

    // Check movie exists and is active
    const movie = await Movie.findById(id);
    if (!movie || !movie.isActive) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Movie not found' } });
      return;
    }

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // TODO: Query Showtime model when Member 4 implements it
    // For now, return empty array to satisfy API contract
    // const Showtime = mongoose.model('Showtime');
    // const skip = (page - 1) * limit;
    // const showtimes = await Showtime.find({ movieId: id, isActive: true })
    //   .populate('cinemaId')
    //   .sort({ startTime: 1 })
    //   .skip(skip)
    //   .limit(limit);
    // const total = await Showtime.countDocuments({ movieId: id, isActive: true });

    const showtimes: unknown[] = [];
    const total = 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        showtimes,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Get movie showtimes error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching showtimes' },
    });
  }
};

/**
 * Get all reviews for a specific movie
 * GET /api/movies/:id/reviews
 * Note: Depends on Review model (Member 8)
 */
export const getMovieReviews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res
        .status(400)
        .json({ success: false, error: { message: 'Invalid movie id' } });
      return;
    }

    // Check movie exists and is active
    const movie = await Movie.findById(id);
    if (!movie || !movie.isActive) {
      res
        .status(404)
        .json({ success: false, error: { message: 'Movie not found' } });
      return;
    }

    // Pagination
    let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // TODO: Query Review model when Member 8 implements it
    // For now, return empty array to satisfy API contract
    // const Review = mongoose.model('Review');
    // const skip = (page - 1) * limit;
    // const reviews = await Review.find({ targetType: 'movie', targetId: id, isActive: true })
    //   .populate('userId', 'firstName lastName')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit);
    // const total = await Review.countDocuments({ targetType: 'movie', targetId: id, isActive: true });

    const reviews: unknown[] = [];
    const total = 0;
    const pages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { page, limit, total, pages },
      },
    });
  } catch (error) {
    console.error('Get movie reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching reviews' },
    });
  }
};

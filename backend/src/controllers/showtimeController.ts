// showtimeController.ts (Member 4)
// Showtime controller - Contains business logic for showtime-related operations
// Handles showtime listing, filtering by cinema/movie, availability checks, and showtime management


import { Request, Response } from "express";
import mongoose from "mongoose";
import Showtime from "../models/Showtime";
import Movie from "../models/Movie";
import Cinema from "../models/Cinema";


// Helpers
const toDateOnly = (d: Date | string) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const addMinutes = (start: Date, mins: number) =>
  new Date(start.getTime() + mins * 60 * 1000);

const isPlatformAdmin = (req: Request) => (req as any).user?.role === "platform_admin";
const isCinemaAdmin = (req: Request) => (req as any).user?.role === "cinema_admin";
const getUserCinemaId = (req: Request) => (req as any).user?.cinemaId;

// Ownership guard: cinema admin must own the cinema
const assertCinemaOwnership = (req: Request, cinemaId: string) => {
  if (isCinemaAdmin(req)) {
    const userCinemaId = getUserCinemaId(req);
    if (!userCinemaId || userCinemaId.toString() !== cinemaId.toString()) {
      const err = new Error("Forbidden: You can only manage showtimes for your own cinema.");
      (err as any).status = 403;
      throw err;
    }
  }
};

// Booking guard placeholder (no Booking model)
const hasBookings = async (_showtimeId: string) => {
  // TODO: Implement booking check when Booking model is available
  return false;
};

// 1. createShowtime
export const createShowtime = async (req: Request, res: Response) => {
  try {
    const { movieId, cinemaId, startTime, format, totalSeats } = req.body;

    if (!movieId || !cinemaId || !startTime || !format || !totalSeats) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    assertCinemaOwnership(req, cinemaId);

    const [movie, cinema] = await Promise.all([
      Movie.findById(movieId),
      Cinema.findById(cinemaId),
    ]);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    if (!cinema) return res.status(404).json({ message: "Cinema not found." });

    const start = new Date(startTime);
    const endTimeComputed = addMinutes(start, movie.duration);
    const dateOnly = toDateOnly(start);

    const showtime = await Showtime.create({
      movie: movie._id,
      cinema: cinema._id,
      startTime: start,
      endTime: endTimeComputed,
      date: dateOnly,
      format,
      totalSeats,
      availableSeats: totalSeats,
      isDeleted: false,
    });

    const populated = await showtime.populate("movie").populate("cinema");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to create showtime." });
  }
};

// 2. getAllShowtimes
export const getAllShowtimes = async (req: Request, res: Response) => {
  try {
    const { movieId, cinemaId, date, format } = req.query;

    const filter: any = { isDeleted: false };
    if (movieId) filter.movie = movieId;
    if (cinemaId) filter.cinema = cinemaId;
    if (date) filter.date = toDateOnly(date as string);
    if (format) filter.format = format;

    const showtimes = await Showtime.find(filter)
      .populate("movie")
      .populate("cinema")
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch showtimes." });
  }
};

// 3. getShowtimeById
export const getShowtimeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const showtime = await Showtime.findById(id)
      .where({ isDeleted: false })
      .populate("movie")
      .populate("cinema");

    if (!showtime) return res.status(404).json({ message: "Showtime not found." });
    res.json(showtime);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch showtime." });
  }
};

// 4. updateShowtime
export const updateShowtime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const existing = await Showtime.findById(id);
    if (!existing || existing.isDeleted) return res.status(404).json({ message: "Showtime not found." });

    if (!isPlatformAdmin(req)) {
      assertCinemaOwnership(req, existing.cinema.toString());
    }

    if (await hasBookings(id)) {
      return res.status(409).json({ message: "Cannot update: bookings exist for this showtime." });
    }

    const { startTime, format, totalSeats } = req.body;

    if (startTime) {
      const movie = await Movie.findById(existing.movie);
      if (!movie) return res.status(404).json({ message: "Movie not found." });
      const newStart = new Date(startTime);
      existing.startTime = newStart;
      existing.endTime = addMinutes(newStart, movie.duration);
      existing.date = toDateOnly(newStart);
    }

    if (format) existing.format = format;

    if (typeof totalSeats === "number") {
      const delta = totalSeats - existing.totalSeats;
      existing.totalSeats = totalSeats;
      existing.availableSeats = Math.max(0, existing.availableSeats + delta);
    }

    await existing.save();
    const populated = await existing.populate("movie").populate("cinema");
    res.json(populated);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to update showtime." });
  }
};

// 5. deleteShowtime
export const deleteShowtime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const showtime = await Showtime.findById(id);
    if (!showtime || showtime.isDeleted) return res.status(404).json({ message: "Showtime not found." });

    if (!isPlatformAdmin(req)) {
      assertCinemaOwnership(req, showtime.cinema.toString());
    }

    if (await hasBookings(id)) {
      return res.status(409).json({ message: "Cannot delete: bookings exist for this showtime." });
    }

    showtime.isDeleted = true;
    await showtime.save();
    res.json({ message: "Showtime soft-deleted." });
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to delete showtime." });
  }
};

// 6. getShowtimesByMovie
export const getShowtimesByMovie = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.isValidObjectId(movieId)) return res.status(400).json({ message: "Invalid movieId." });

    const filter: any = { isDeleted: false, movie: movieId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = toDateOnly(startDate as string);
      if (endDate) filter.date.$lte = toDateOnly(endDate as string);
    }

    const showtimes = await Showtime.find(filter)
      .populate("cinema")
      .populate("movie")
      .sort({ startTime: 1 });

    const grouped: Record<string, any[]> = {};
    showtimes.forEach(st => {
      const key = (st.cinema as any)._id.toString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(st);
    });

    res.json({ movieId, groupsByCinema: grouped });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch showtimes by movie." });
  }
};

// 7. getShowtimesByCinema
export const getShowtimesByCinema = async (req: Request, res: Response) => {
  try {
    const { cinemaId } = req.params;
    const { date } = req.query;

    if (!mongoose.isValidObjectId(cinemaId)) return res.status(400).json({ message: "Invalid cinemaId." });

    const filter: any =
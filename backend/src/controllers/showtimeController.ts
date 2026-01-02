// showtimeController.ts (Member 4)
// Showtime controller - Contains business logic for showtime-related operations
// Handles showtime listing, filtering by cinema/movie, availability checks, and showtime management

import { Request, Response } from "express";
import mongoose from "mongoose";
import Showtime from "../models/Showtime";
import Movie from "../models/Movie";
import Cinema from "../models/Cinema";

/* =======================
  Helpers
======================= */

// Convert date to date-only (midnight)
const toDateOnly = (d: Date | string) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Add minutes to a Date
const addMinutes = (start: Date, mins: number) => new Date(start.getTime() + mins * 60 * 1000);

// Role helpers
const isPlatformAdmin = (req: Request) => (req as any).user?.role === "platform_admin";
const isCinemaAdmin = (req: Request) => (req as any).user?.role === "cinema_admin";
const getUserCinemaId = (req: Request) => (req as any).user?.cinemaId;

// Ownership guard
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

/* =======================
  1. Create Showtime
======================= */
export const createShowtime = async (req: Request, res: Response) => {
  try {
    const { movieId, cinemaId, startTime, format, totalSeats, screenNumber, price, language } = req.body;

    if (!movieId || !cinemaId || !startTime || !format || !totalSeats || !screenNumber || !price) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    assertCinemaOwnership(req, cinemaId);

    const [movie, cinema] = await Promise.all([
      Movie.findById(movieId),
      Cinema.findById(cinemaId),
    ]);

    if (!movie) return res.status(404).json({ message: "Movie not found." });
    if (!cinema) return res.status(404).json({ message: "Cinema not found." });
    if (!movie.duration) return res.status(400).json({ message: "Movie duration is missing." });

    const start = new Date(startTime);
    const endTime = addMinutes(start, movie.duration);
    const date = toDateOnly(start);

    const showtime = await Showtime.create({
      movieId: movie._id,
      cinemaId: cinema._id,
      startTime: start,
      endTime,
      date,
      format,
      totalSeats,
      availableSeats: totalSeats,
      screenNumber,
      price,
      language,
      isActive: true,
    });

    // Populate movieId and cinemaId
    const populated = await showtime.populate([{ path: "movieId" }, { path: "cinemaId" }]);
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to create showtime." });
  }
};

/* =======================
  2. Get All Showtimes (Public)
======================= */
export const getAllShowtimes = async (req: Request, res: Response) => {
  try {
    const { movieId, cinemaId, date, format } = req.query;

    const filter: any = { isActive: true };
    if (movieId) filter.movieId = movieId;
    if (cinemaId) filter.cinemaId = cinemaId;
    if (date) filter.date = toDateOnly(date as string);
    if (format) filter.format = format;

    const showtimes = await Showtime.find(filter)
      .populate([{ path: "movieId" }, { path: "cinemaId" }])
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch {
    res.status(500).json({ message: "Failed to fetch showtimes." });
  }
};

/* =======================
  3. Get Showtime By ID
======================= */
export const getShowtimeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const showtime = await Showtime.findById(id)
      .where({ isActive: true })
      .populate([{ path: "movieId" }, { path: "cinemaId" }]);

    if (!showtime) return res.status(404).json({ message: "Showtime not found." });
    res.json(showtime);
  } catch {
    res.status(500).json({ message: "Failed to fetch showtime." });
  }
};

/* =======================
  4. Update Showtime
======================= */
export const updateShowtime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const showtime = await Showtime.findById(id);
    if (!showtime || !showtime.isActive) return res.status(404).json({ message: "Showtime not found." });

    if (!isPlatformAdmin(req)) assertCinemaOwnership(req, showtime.cinemaId.toString());
    if (showtime.hasBookings) return res.status(409).json({ message: "Cannot update: bookings exist." });

    const { startTime, format, totalSeats, price, language } = req.body;

    if (startTime) {
      const movie = await Movie.findById(showtime.movieId);
      if (!movie || !movie.duration) return res.status(404).json({ message: "Movie not found or missing duration." });

      const newStart = new Date(startTime);
      showtime.startTime = newStart;
      showtime.endTime = addMinutes(newStart, movie.duration);
      showtime.date = toDateOnly(newStart);
    }

    if (format) showtime.format = format;
    if (typeof totalSeats === "number") {
      const delta = totalSeats - showtime.totalSeats;
      showtime.totalSeats = totalSeats;
      showtime.availableSeats = Math.max(0, showtime.availableSeats + delta);
    }
    if (typeof price === "number") showtime.price = price;
    if (language) showtime.language = language;

    await showtime.save();

    const populated = await showtime.populate([{ path: "movieId" }, { path: "cinemaId" }]);
    res.json(populated);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to update showtime." });
  }
};

/* =======================
  5. Delete Showtime (Soft Delete)
======================= */
export const deleteShowtime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid ID." });

    const showtime = await Showtime.findById(id);
    if (!showtime || !showtime.isActive) return res.status(404).json({ message: "Showtime not found." });

    if (!isPlatformAdmin(req)) assertCinemaOwnership(req, showtime.cinemaId.toString());
    if (showtime.hasBookings) return res.status(409).json({ message: "Cannot delete: bookings exist." });

    showtime.isActive = false; // Soft delete
    await showtime.save();

    res.json({ message: "Showtime soft-deleted." });
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Failed to delete showtime." });
  }
};


// 6. getShowtimesByMovie
export const getShowtimesByMovie = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params; // must match the route param
    const { startDate, endDate } = req.query;

    if (!mongoose.isValidObjectId(movieId)) {
      return res.status(400).json({ message: "Invalid movieId." });
    }

    const filter: any = { movieId, isActive: true };
    if (startDate || endDate) filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) filter.date.$lte = new Date(endDate as string);

    const showtimes = await Showtime.find(filter)
      .populate([{ path: "movieId" }, { path: "cinemaId" }])
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch showtimes by movie." });
  }
};

// 7. getShowtimesByCinema
export const getShowtimesByCinema = async (req: Request, res: Response) => {
  try {
    const { cinemaId } = req.params; // must match the route param
    const { date } = req.query;

    if (!mongoose.isValidObjectId(cinemaId)) {
      return res.status(400).json({ message: "Invalid cinemaId." });
    }

    const filter: any = { cinemaId, isActive: true };
    if (date) filter.date = new Date(date as string);

    const showtimes = await Showtime.find(filter)
      .populate([{ path: "movieId" }, { path: "cinemaId" }])
      .sort({ startTime: 1 });

    res.json(showtimes);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch showtimes by cinema." });
  }
};


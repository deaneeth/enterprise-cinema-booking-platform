// analyticsController.ts
// Analytics endpoints for platform admin dashboard
// Provides overview stats, revenue data, and booking trends

import { Request, Response } from 'express';
import Booking from '../models/Booking';
import User from '../models/User';
import Cinema from '../models/Cinema';
import Movie from '../models/Movie';
import Showtime from '../models/Showtime';

// Helper to get date range based on period
const getDateRange = (period: string) => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 7); // Default to week
  }

  return { start, end };
};

// GET /api/admin/analytics/overview
// Returns system-wide statistics
export const getOverview = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalCinemas,
      totalMovies,
      totalBookings,
      confirmedBookings,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Cinema.countDocuments({ isActive: true }),
      Movie.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.find({ bookingStatus: 'confirmed' }),
    ]);

    // Calculate total revenue from confirmed bookings
    const totalRevenue = confirmedBookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0
    );

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: today },
    });

    // Get pending cinema admin applications
    const pendingApplications = await User.countDocuments({
      applicationStatus: 'pending',
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCinemas,
        totalMovies,
        totalBookings,
        confirmedBookings: confirmedBookings.length,
        totalRevenue,
        todayBookings,
        pendingApplications,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics overview' },
    });
  }
};

// GET /api/admin/analytics/revenue
// Returns revenue data grouped by day for charts
export const getRevenueData = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const { start, end } = getDateRange(period);

    const bookings = await Booking.find({
      bookingStatus: 'confirmed',
      createdAt: { $gte: start, $lte: end },
    }).select('totalAmount createdAt');

    // Group by date
    const revenueByDate: Record<string, number> = {};

    bookings.forEach((booking) => {
      const dateKey = booking.createdAt.toISOString().split('T')[0];
      revenueByDate[dateKey] =
        (revenueByDate[dateKey] || 0) + (booking.totalAmount || 0);
    });

    // Convert to array for charts
    const revenueData = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      data: {
        period,
        totalRevenue,
        dataPoints: revenueData,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch revenue data' },
    });
  }
};

// GET /api/admin/analytics/bookings
// Returns booking counts grouped by day for charts
export const getBookingsData = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    const { start, end } = getDateRange(period);

    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
    }).select('bookingStatus createdAt');

    // Group by date
    const bookingsByDate: Record<
      string,
      { total: number; confirmed: number; cancelled: number }
    > = {};

    bookings.forEach((booking) => {
      const dateKey = booking.createdAt.toISOString().split('T')[0];
      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = { total: 0, confirmed: 0, cancelled: 0 };
      }
      bookingsByDate[dateKey].total++;
      if (booking.bookingStatus === 'confirmed')
        bookingsByDate[dateKey].confirmed++;
      if (booking.bookingStatus === 'cancelled')
        bookingsByDate[dateKey].cancelled++;
    });

    // Convert to array
    const bookingsData = Object.entries(bookingsByDate)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        period,
        totalBookings: bookings.length,
        dataPoints: bookingsData,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings data:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch bookings data' },
    });
  }
};

// GET /api/admin/analytics/top-movies
// Returns top 10 movies by booking count
export const getTopMovies = async (req: Request, res: Response) => {
  try {
    // Get all confirmed bookings with showtime populated
    const bookings = await Booking.find({
      bookingStatus: 'confirmed',
    }).populate({
      path: 'showtimeId',
      select: 'movieId',
      populate: { path: 'movieId', select: 'title posterUrl' },
    });

    // Count bookings per movie
    const movieCounts: Record<
      string,
      { title: string; posterUrl?: string; count: number; revenue: number }
    > = {};

    bookings.forEach((booking) => {
      interface PopulatedShowtime {
        movieId?: {
          _id?: { toString: () => string };
          toString: () => string;
          title?: string;
          posterUrl?: string;
        };
      }
      const showtime = booking.showtimeId as PopulatedShowtime;
      if (showtime?.movieId) {
        const movie = showtime.movieId;
        const movieId = movie._id?.toString() || movie.toString();

        if (!movieCounts[movieId]) {
          movieCounts[movieId] = {
            title: movie.title || 'Unknown',
            posterUrl: movie.posterUrl,
            count: 0,
            revenue: 0,
          };
        }
        movieCounts[movieId].count++;
        movieCounts[movieId].revenue += booking.totalAmount || 0;
      }
    });

    // Sort by count and take top 10
    const topMovies = Object.entries(movieCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: topMovies,
    });
  } catch (error) {
    console.error('Error fetching top movies:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch top movies' },
    });
  }
};

// GET /api/admin/analytics/cinemas
// Returns cinema performance data
export const getCinemaStats = async (req: Request, res: Response) => {
  try {
    const cinemas = await Cinema.find({ isActive: true }).select(
      'name location'
    );

    // Get bookings for each cinema
    const cinemaStats = await Promise.all(
      cinemas.map(async (cinema) => {
        const showtimes = await Showtime.find({
          cinemaId: cinema._id,
          isActive: true,
        });
        const showtimeIds = showtimes.map((s) => s._id);

        const bookings = await Booking.find({
          showtimeId: { $in: showtimeIds },
          bookingStatus: 'confirmed',
        });

        const totalRevenue = bookings.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        );

        return {
          id: cinema._id,
          name: cinema.name,
          city: cinema.location?.city || 'Unknown',
          totalShowtimes: showtimes.length,
          totalBookings: bookings.length,
          totalRevenue,
        };
      })
    );

    // Sort by revenue
    cinemaStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: cinemaStats,
    });
  } catch (error) {
    console.error('Error fetching cinema stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch cinema statistics' },
    });
  }
};

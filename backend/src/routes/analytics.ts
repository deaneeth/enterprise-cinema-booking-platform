// analytics.ts
// Analytics routes - Platform admin only
// Provides data for the analytics dashboard

import { Router } from 'express';
import {
  getOverview,
  getRevenueData,
  getBookingsData,
  getTopMovies,
  getCinemaStats,
} from '../controllers/analyticsController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// All routes require platform_admin role
const adminAuth = [authenticate, requireRole('platform_admin')];

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get system-wide statistics
 * @access  Private (Platform Admin only)
 */
router.get('/admin/analytics/overview', ...adminAuth, getOverview);

/**
 * @route   GET /api/admin/analytics/revenue
 * @desc    Get revenue data grouped by day (for charts)
 * @access  Private (Platform Admin only)
 * @query   period - week|month|year
 */
router.get('/admin/analytics/revenue', ...adminAuth, getRevenueData);

/**
 * @route   GET /api/admin/analytics/bookings
 * @desc    Get booking counts grouped by day (for charts)
 * @access  Private (Platform Admin only)
 * @query   period - week|month|year
 */
router.get('/admin/analytics/bookings', ...adminAuth, getBookingsData);

/**
 * @route   GET /api/admin/analytics/top-movies
 * @desc    Get top 10 movies by booking count
 * @access  Private (Platform Admin only)
 */
router.get('/admin/analytics/top-movies', ...adminAuth, getTopMovies);

/**
 * @route   GET /api/admin/analytics/cinemas
 * @desc    Get cinema performance statistics
 * @access  Private (Platform Admin only)
 */
router.get('/admin/analytics/cinemas', ...adminAuth, getCinemaStats);

export default router;

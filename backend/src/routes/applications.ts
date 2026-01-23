// applications.ts
// Application routes - Cinema admin application workflow
// Public routes for applying, protected routes for admin management

import { Router } from 'express';
import {
  applyCinemaAdmin,
  listApplications,
  approveApplication,
  rejectApplication,
  getMyApplication,
} from '../controllers/applicationController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// USER ROUTES (Authenticated users)
// ============================================

/**
 * @route   POST /api/auth/apply-cinema-admin
 * @desc    Apply to become a cinema admin
 * @access  Private (Authenticated users)
 */
router.post('/auth/apply-cinema-admin', authenticate, applyCinemaAdmin);

/**
 * @route   GET /api/auth/my-application
 * @desc    Get current user's application status
 * @access  Private (Authenticated users)
 */
router.get('/auth/my-application', authenticate, getMyApplication);

// ============================================
// ADMIN ROUTES (Platform Admin only)
// ============================================

/**
 * @route   GET /api/admin/applications
 * @desc    List all cinema admin applications
 * @access  Private (Platform Admin only)
 * @query   status - 'pending' | 'all' (default: pending)
 */
router.get(
  '/admin/applications',
  authenticate,
  requireRole('platform_admin'),
  listApplications
);

/**
 * @route   PUT /api/admin/applications/:userId/approve
 * @desc    Approve a cinema admin application
 * @access  Private (Platform Admin only)
 * @body    cinemaId (optional) - Assign to existing cinema
 * @body    createCinema (optional) - Create new cinema from application
 */
router.put(
  '/admin/applications/:userId/approve',
  authenticate,
  requireRole('platform_admin'),
  approveApplication
);

/**
 * @route   PUT /api/admin/applications/:userId/reject
 * @desc    Reject a cinema admin application
 * @access  Private (Platform Admin only)
 * @body    reason (optional) - Rejection reason
 */
router.put(
  '/admin/applications/:userId/reject',
  authenticate,
  requireRole('platform_admin'),
  rejectApplication
);

export default router;

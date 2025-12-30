// users.ts (Member 1)
// User routes - Defines API endpoints for user-related operations
// Handles routes for registration, login, profile management, and user authentication

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deactivateUser,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/userController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/auth/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/auth/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/auth/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/auth/reset-password', resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/auth/me', authenticate, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate session)
 * @access  Private
 */
router.post('/auth/logout', authenticate, logout);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/users/:id', authenticate, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner or Admin)
 */
router.put('/users/:id', authenticate, updateProfile);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Owner only)
 */
router.put('/users/:id/change-password', authenticate, changePassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user account (soft delete)
 * @access  Private (Owner or Admin)
 */
router.delete('/users/:id', authenticate, deactivateUser);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Private (Platform Admin only)
 */
router.get('/users', authenticate, requireRole('platform_admin'), getAllUsers);

export default router;

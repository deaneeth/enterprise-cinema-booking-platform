// userController.ts (Member 1)
// User controller - Contains business logic for user-related operations
// Handles user registration, authentication, profile updates, and account management

import { Request, Response } from 'express';
import User from '../models/User';
// Import to ensure Express Request type is extended with user property
import '../middlewares/auth';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Please provide email, password, firstName, and lastName',
        },
      });
      return;
    }

    // Validate phone number format if provided
    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Please provide a valid phone number',
        },
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: { message: 'User with this email already exists' },
      });
      return;
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle Mongoose validation errors
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: { message: error.message },
        });
        return;
      }
      // Handle other known error types
      if (error.message) {
        res.status(500).json({
          success: false,
          error: { message: 'Server error during registration' },
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error during registration' },
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Please provide email and password' },
      });
      return;
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Your account has been deactivated. Please contact support.',
        },
      });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
      return;
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during login' },
    });
  }
};

/**
 * Get current logged in user
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          phone: req.user.phone,
          role: req.user.role,
          isActive: req.user.isActive,
          cinemaId: req.user.cinemaId,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error' },
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    // Check if user is updating their own profile or is admin
    const isOwner = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only update your own profile' },
      });
      return;
    }

    // Find user and update
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during profile update' },
    });
  }
};

/**
 * Change user password
 * PUT /api/users/:id/change-password
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    // Validate required fields
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Please provide current password and new password' },
      });
      return;
    }

    // Validate new password length
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 6 characters' },
      });
      return;
    }

    // Check if user is changing their own password
    if (req.user._id.toString() !== id) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only change your own password' },
      });
      return;
    }

    // Find user with password
    const user = await User.findById(id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { message: 'Current password is incorrect' },
      });
      return;
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during password change' },
    });
  }
};

/**
 * Get all users (admin only)
 * GET /api/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: Record<string, unknown> = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users.map((user) => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        cinemaId: user.cinemaId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error' },
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          cinemaId: user.cinemaId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error' },
    });
  }
};

/**
 * Deactivate user (soft delete)
 * DELETE /api/users/:id
 */
export const deactivateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    // Check if user is deactivating their own account or is admin
    const isOwner = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: { message: 'You can only deactivate your own account' },
      });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
      return;
    }

    // Soft delete: set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: 'User account deactivated successfully' },
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during account deactivation' },
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // For stateless JWT, logout is handled client-side by removing the token
    // If using token blacklisting, add the token to a blacklist here
    // For now, we just return success and let the client clear the token

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during logout' },
    });
  }
};

/**
 * Forgot password - sends reset token
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: { message: 'Email is required' },
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message (don't reveal if email exists for security)
    if (!user) {
      res.status(200).json({
        success: true,
        data: {
          message:
            'If an account with that email exists, a password reset link has been sent',
        },
      });
      return;
    }

    // Generate reset token (random 32 byte hex string)
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the reset token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiry on user document (1 hour expiry)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production, send email with reset link
    // For now, log the reset link to console (mock email) - development only
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Development-only mock email logging (no sensitive token/URL)
    if (process.env.NODE_ENV === 'development') {
      console.warn('='.repeat(50));
      console.warn('PASSWORD RESET REQUESTED (DEV MOCK EMAIL)');
      console.warn(`Email: ${user.email}`);
      console.warn('A password reset link would be sent to this address in production.');
      console.warn('Token expires in: 1 hour');
      console.warn('='.repeat(50));
    }

    res.status(200).json({
      success: true,
      data: {
        message:
          'If an account with that email exists, a password reset link has been sent',
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during password reset request' },
    });
  }
};

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: { message: 'Reset token and new password are required' },
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters' },
      });
      return;
    }

    // Hash the provided token to match stored hash
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid or expired reset token' },
      });
      return;
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        message:
          'Password reset successful. You can now login with your new password.',
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during password reset' },
    });
  }
};

export default {
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
};

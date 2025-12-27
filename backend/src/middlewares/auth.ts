// auth.ts (Member 1)
// Authentication middleware - Handles JWT token verification and user authentication
// Validates user tokens, manages authentication state, and protects protected routes

import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { verifyToken, DecodedToken } from '../utils/jwt';

// Extend Express Request interface to include user
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

/**
 * Authentication middleware - Protects routes by verifying JWT token
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' },
      });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. Invalid token format. Use Bearer token.',
        },
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' },
      });
      return;
    }

    // Verify the token
    const decoded: DecodedToken | null = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. Invalid or expired token.' },
      });
      return;
    }

    // Find user by ID from decoded token
    // Use select('+password') only if you need password, otherwise password is excluded
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. User not found.' },
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. User account is deactivated.' },
      });
      return;
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during authentication.' },
    });
  }
};

/**
 * Role-based authorization middleware
 * Restricts access to users with specific roles
 * @param roles - Array of allowed roles
 */
export const requireRole = (
  ...roles: Array<'user' | 'cinema_admin' | 'platform_admin'>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. Authentication required.' },
      });
      return;
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 * Useful for routes that behave differently for authenticated vs unauthenticated users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      next();
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);

    if (decoded) {
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently continue without user on error
    next();
  }
};

/**
 * Check if user owns the resource or is admin
 * @param resourceUserId - The user ID that owns the resource
 */
export const requireOwnerOrAdmin = (resourceUserId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Access denied. Authentication required.' },
      });
      return;
    }

    const isOwner = req.user._id.toString() === resourceUserId;
    const isAdmin = req.user.role === 'platform_admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only access your own resources.',
        },
      });
      return;
    }

    next();
  };
};

export default {
  authenticate,
  requireRole,
  optionalAuth,
  requireOwnerOrAdmin,
};

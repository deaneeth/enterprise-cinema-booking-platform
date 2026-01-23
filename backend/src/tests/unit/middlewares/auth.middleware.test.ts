// auth.middleware.test.ts (Member 8 - Testing Lead)
// Unit tests for Authentication middleware
// Tests authenticate, requireRole, optionalAuth, and requireOwnerOrAdmin

import { Request, Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  optionalAuth,
  requireOwnerOrAdmin,
} from '../../../middlewares/auth';

// Mock the jwt utility
jest.mock('../../../utils/jwt', () => ({
  verifyToken: jest.fn().mockImplementation((token: string) => {
    if (token === 'valid-token') {
      return { id: 'user123', email: 'test@example.com', role: 'user' };
    }
    if (token === 'admin-token') {
      return {
        id: 'admin123',
        email: 'admin@example.com',
        role: 'platform_admin',
      };
    }
    if (token === 'cinema-admin-token') {
      return {
        id: 'cinema123',
        email: 'cinema@example.com',
        role: 'cinema_admin',
      };
    }
    return null;
  }),
}));

// Mock the User model
jest.mock('../../../models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === 'user123') {
        return Promise.resolve({
          _id: { toString: () => 'user123' },
          email: 'test@example.com',
          role: 'user',
          isActive: true,
        });
      }
      if (id === 'admin123') {
        return Promise.resolve({
          _id: { toString: () => 'admin123' },
          email: 'admin@example.com',
          role: 'platform_admin',
          isActive: true,
        });
      }
      if (id === 'cinema123') {
        return Promise.resolve({
          _id: { toString: () => 'cinema123' },
          email: 'cinema@example.com',
          role: 'cinema_admin',
          isActive: true,
        });
      }
      if (id === 'inactive-user') {
        return Promise.resolve({
          _id: { toString: () => 'inactive-user' },
          email: 'inactive@example.com',
          role: 'user',
          isActive: false,
        });
      }
      return Promise.resolve(null);
    }),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ============================================
  // authenticate() Tests
  // ============================================
  describe('authenticate()', () => {
    it('should reject request without authorization header', async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. No token provided.' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token123' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied. Invalid token format. Use Bearer token.',
        },
      });
    });

    it('should reject request with empty Bearer token', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. Invalid or expired token.' },
      });
    });

    it('should authenticate user with valid token', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.token).toBe('valid-token');
    });

    it('should reject when user not found in database', async () => {
      const { verifyToken } = require('../../../utils/jwt');
      verifyToken.mockReturnValueOnce({
        id: 'nonexistent',
        email: 'test@example.com',
        role: 'user',
      });
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. User not found.' },
      });
    });

    it('should reject when user is inactive', async () => {
      const { verifyToken } = require('../../../utils/jwt');
      verifyToken.mockReturnValueOnce({
        id: 'inactive-user',
        email: 'inactive@example.com',
        role: 'user',
      });
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. User account is deactivated.' },
      });
    });
  });

  // ============================================
  // requireRole() Tests
  // ============================================
  describe('requireRole()', () => {
    it('should reject when user is not authenticated', () => {
      const middleware = requireRole('user');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. Authentication required.' },
      });
    });

    it('should allow user with matching role', () => {
      mockRequest.user = {
        _id: { toString: () => 'user123' },
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      } as any;

      const middleware = requireRole('user');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user with non-matching role', () => {
      mockRequest.user = {
        _id: { toString: () => 'user123' },
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      } as any;

      const middleware = requireRole('platform_admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should allow user with one of multiple roles', () => {
      mockRequest.user = {
        _id: { toString: () => 'admin123' },
        email: 'admin@example.com',
        role: 'platform_admin',
        isActive: true,
      } as any;

      const middleware = requireRole('user', 'platform_admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow cinema_admin role', () => {
      mockRequest.user = {
        _id: { toString: () => 'cinema123' },
        email: 'cinema@example.com',
        role: 'cinema_admin',
        isActive: true,
      } as any;

      const middleware = requireRole('cinema_admin');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ============================================
  // optionalAuth() Tests
  // ============================================
  describe('optionalAuth()', () => {
    it('should continue without user when no token provided', async () => {
      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without user when token format invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should attach user when valid token provided', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.token).toBe('valid-token');
    });

    it('should continue without user when token invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without user when user not found', async () => {
      const { verifyToken } = require('../../../utils/jwt');
      verifyToken.mockReturnValueOnce({
        id: 'nonexistent',
        email: 'test@example.com',
        role: 'user',
      });
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should continue without user when user is inactive', async () => {
      const { verifyToken } = require('../../../utils/jwt');
      verifyToken.mockReturnValueOnce({
        id: 'inactive-user',
        email: 'inactive@example.com',
        role: 'user',
      });
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });
  });

  // ============================================
  // requireOwnerOrAdmin() Tests
  // ============================================
  describe('requireOwnerOrAdmin()', () => {
    it('should reject when user is not authenticated', () => {
      const middleware = requireOwnerOrAdmin('resource123');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Access denied. Authentication required.' },
      });
    });

    it('should allow owner to access resource', () => {
      mockRequest.user = {
        _id: { toString: () => 'user123' },
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      } as any;

      const middleware = requireOwnerOrAdmin('user123');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow platform_admin to access any resource', () => {
      mockRequest.user = {
        _id: { toString: () => 'admin123' },
        email: 'admin@example.com',
        role: 'platform_admin',
        isActive: true,
      } as any;

      const middleware = requireOwnerOrAdmin('someone-elses-resource');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-owner non-admin', () => {
      mockRequest.user = {
        _id: { toString: () => 'user123' },
        email: 'test@example.com',
        role: 'user',
        isActive: true,
      } as any;

      const middleware = requireOwnerOrAdmin('another-users-resource');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied. You can only access your own resources.',
        },
      });
    });

    it('should reject cinema_admin accessing another users resource', () => {
      mockRequest.user = {
        _id: { toString: () => 'cinema123' },
        email: 'cinema@example.com',
        role: 'cinema_admin',
        isActive: true,
      } as any;

      const middleware = requireOwnerOrAdmin('user123-resource');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});

// errorHandler.middleware.test.ts (Member 8 - Testing Lead)
// Unit tests for Error Handler middleware
// Tests error handling, error formatting, and custom error classes

import { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  CustomError,
  AppError,
} from '../../../middlewares/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      originalUrl: '/api/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ============================================
  // errorHandler() Tests
  // ============================================
  describe('errorHandler()', () => {
    it('should handle generic error with default 500 status', () => {
      const error: AppError = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Something went wrong' },
      });
    });

    it('should use statusCode from error if provided', () => {
      const error: AppError = new Error('Not found');
      error.statusCode = 404;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle CastError (invalid ObjectId)', () => {
      const error: AppError = new Error('Cast error');
      error.name = 'CastError';
      error.path = '_id';
      error.value = 'invalid-id';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid _id: invalid-id',
          field: '_id',
        },
      });
    });

    it('should handle duplicate key error (code 11000)', () => {
      const error: AppError = new Error('Duplicate key');
      error.code = 11000;
      error.keyValue = { email: 'test@example.com' };

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message:
            'Duplicate field value: test@example.com. Please use another value for email.',
          field: 'email',
        },
      });
    });

    it('should handle duplicate key error (string code 11000)', () => {
      const error: AppError = new Error('Duplicate key');
      error.code = '11000';
      error.keyValue = { username: 'testuser' };

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle duplicate key error without keyValue', () => {
      const error: AppError = new Error('Duplicate key');
      error.code = 11000;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message:
            'Duplicate field value: value. Please use another value for field.',
          field: 'field',
        },
      });
    });

    it('should handle ValidationError', () => {
      const error: AppError = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Email is required' },
        password: { message: 'Password must be at least 6 characters' },
      };

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details: [
            'Email is required',
            'Password must be at least 6 characters',
          ],
        },
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error: AppError = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Invalid token. Please log in again.' },
      });
    });

    it('should handle TokenExpiredError', () => {
      const error: AppError = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Your token has expired. Please log in again.' },
      });
    });

    it('should hide error details in production for 500 errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error: AppError = new Error('Database connection failed');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Something went wrong. Please try again later.' },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should log error details', () => {
      const error: AppError = new Error('Test error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // notFoundHandler() Tests
  // ============================================
  describe('notFoundHandler()', () => {
    it('should return 404 with route information', () => {
      mockRequest.originalUrl = '/api/nonexistent';

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Route /api/nonexistent not found' },
      });
    });

    it('should handle different route paths', () => {
      mockRequest.originalUrl = '/users/123/bookings';

      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Route /users/123/bookings not found' },
      });
    });
  });

  // ============================================
  // asyncHandler() Tests
  // ============================================
  describe('asyncHandler()', () => {
    it('should call next with error when async function throws', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      const wrappedHandler = asyncHandler(asyncFn);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Need to wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not call next when async function succeeds', async () => {
      const asyncFn = async (
        _req: Request,
        res: Response,
        _next: NextFunction
      ) => {
        res.status(200).json({ success: true });
      };

      const wrappedHandler = asyncHandler(asyncFn);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================
  // CustomError Tests
  // ============================================
  describe('CustomError', () => {
    it('should create error with correct properties', () => {
      const error = new CustomError('Custom error message', 400);

      expect(error.message).toBe('Custom error message');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
    });

    it('should set status to fail for 4xx errors', () => {
      const error404 = new CustomError('Not found', 404);
      const error403 = new CustomError('Forbidden', 403);

      expect(error404.status).toBe('fail');
      expect(error403.status).toBe('fail');
    });

    it('should set status to error for 5xx errors', () => {
      const error500 = new CustomError('Server error', 500);
      const error503 = new CustomError('Service unavailable', 503);

      expect(error500.status).toBe('error');
      expect(error503.status).toBe('error');
    });

    it('should capture stack trace', () => {
      const error = new CustomError('Test error', 400);

      expect(error.stack).toBeDefined();
      // Stack trace should exist and contain error information
      expect(error.stack!.length).toBeGreaterThan(0);
    });

    it('should be an instance of Error', () => {
      const error = new CustomError('Test', 400);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof CustomError).toBe(true);
    });
  });
});

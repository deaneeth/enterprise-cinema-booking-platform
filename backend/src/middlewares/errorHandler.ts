// errorHandler.ts (Member 1)
// Error handler middleware - Handles application errors and exceptions
// Catches errors, formats error responses, and logs error information

import { Request, Response, NextFunction } from 'express';

// Custom error interface for application-specific errors
export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number | string;
  path?: string;
  value?: string;
  errors?: Record<string, { message: string }>;
  keyValue?: Record<string, unknown>;
}

// Error response interface for consistent format
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    field?: string;
    details?: string[];
  };
}

/**
 * Create a standardized error response
 */
const createErrorResponse = (
  message: string,
  field?: string,
  details?: string[]
): ErrorResponse => {
  const response: ErrorResponse = {
    success: false,
    error: { message },
  };

  if (field) {
    response.error.field = field;
  }

  if (details && details.length > 0) {
    response.error.details = details;
  }

  return response;
};

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (
  err: AppError
): { statusCode: number; response: ErrorResponse } => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return {
    statusCode: 400,
    response: createErrorResponse(message, err.path),
  };
};

/**
 * Handle Mongoose Duplicate Key Error (code 11000)
 */
const handleDuplicateKeyError = (
  err: AppError
): { statusCode: number; response: ErrorResponse } => {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'value';
  const message = `Duplicate field value: ${value}. Please use another value for ${field}.`;
  return {
    statusCode: 400,
    response: createErrorResponse(message, field),
  };
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationError = (
  err: AppError
): { statusCode: number; response: ErrorResponse } => {
  const errors = err.errors || {};
  const details = Object.values(errors).map((error) => error.message);
  const message = 'Validation failed';
  return {
    statusCode: 400,
    response: createErrorResponse(message, undefined, details),
  };
};

/**
 * Handle JWT Error (invalid token)
 */
const handleJWTError = (): { statusCode: number; response: ErrorResponse } => {
  return {
    statusCode: 401,
    response: createErrorResponse('Invalid token. Please log in again.'),
  };
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = (): {
  statusCode: number;
  response: ErrorResponse;
} => {
  return {
    statusCode: 401,
    response: createErrorResponse(
      'Your token has expired. Please log in again.'
    ),
  };
};

/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error format
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error properties
  let statusCode = err.statusCode || 500;
  let response: ErrorResponse = createErrorResponse(
    err.message || 'Internal server error'
  );

  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === 'CastError') {
    const result = handleCastError(err);
    statusCode = result.statusCode;
    response = result.response;
  }

  if (err.code === 11000 || err.code === '11000') {
    const result = handleDuplicateKeyError(err);
    statusCode = result.statusCode;
    response = result.response;
  }

  if (err.name === 'ValidationError') {
    const result = handleValidationError(err);
    statusCode = result.statusCode;
    response = result.response;
  }

  if (err.name === 'JsonWebTokenError') {
    const result = handleJWTError();
    statusCode = result.statusCode;
    response = result.response;
  }

  if (err.name === 'TokenExpiredError') {
    const result = handleJWTExpiredError();
    statusCode = result.statusCode;
    response = result.response;
  }

  // In production, don't leak error details for 500 errors
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response = createErrorResponse(
      'Something went wrong. Please try again later.'
    );
  }

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res
    .status(404)
    .json(createErrorResponse(`Route ${req.originalUrl} not found`));
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom application error
 */
export class CustomError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  CustomError,
};

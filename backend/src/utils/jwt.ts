// jwt.ts (Member 1)
// JWT utility - Handles JSON Web Token operations
// Generates JWT tokens, verifies tokens, and manages token expiration

import * as jwt from 'jsonwebtoken';

// Interface for JWT payload
export interface JwtPayload {
  id: string;
  email: string;
  role: 'user' | 'cinema_admin' | 'platform_admin';
  iat?: number;
  exp?: number;
}

// Interface for decoded token result
export interface DecodedToken extends JwtPayload {
  iat: number;
  exp: number;
}

// Get JWT secret from environment variables
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

// Get JWT expiration time from environment variables
const getJwtExpire = (): string => {
  return process.env.JWT_EXPIRE || '24h';
};

/**
 * Generate a JWT token for a user
 * @param userId - User's MongoDB ObjectId as string
 * @param email - User's email address
 * @param role - User's role (user, cinema_admin, platform_admin)
 * @returns JWT token string
 */
export const generateToken = (
  userId: string,
  email: string,
  role: 'user' | 'cinema_admin' | 'platform_admin'
): string => {
  const payload: JwtPayload = {
    id: userId,
    email,
    role,
  };

  const secret = getJwtSecret();
  const expiresIn = getJwtExpire();

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Verify a JWT token and return the decoded payload
 * @param token - JWT token string to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as DecodedToken;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
};

/**
 * Decode a JWT token without verifying (useful for debugging)
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid format
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Check if a token is expired
 * @param token - JWT token string to check
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};

export default {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
};

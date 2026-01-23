// jwt.test.ts (Member 8 - Testing Lead)
// Unit tests for JWT utility functions
// Tests token generation, verification, decoding, and expiration

import * as jwtUtils from '../../../utils/jwt';

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid.token') {
      return {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    if (token === 'expired.token') {
      throw new Error('jwt expired');
    }
    throw new Error('invalid token');
  }),
  decode: jest.fn().mockImplementation((token) => {
    if (token === 'valid.token') {
      return {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    if (token === 'expired.token') {
      return {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };
    }
    return null;
  }),
}));

describe('JWT Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRE = '24h';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ============================================
  // generateToken() Tests
  // ============================================
  describe('generateToken()', () => {
    it('should generate a token for a user', () => {
      const token = jwtUtils.generateToken(
        'user123',
        'test@example.com',
        'user'
      );

      expect(token).toBe('mock.jwt.token');
      const jwt = require('jsonwebtoken');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 'user123',
          email: 'test@example.com',
          role: 'user',
        },
        'test-secret-key',
        { expiresIn: '24h' }
      );
    });

    it('should generate a token for cinema_admin', () => {
      const token = jwtUtils.generateToken(
        'admin123',
        'admin@cinema.com',
        'cinema_admin'
      );

      expect(token).toBe('mock.jwt.token');
    });

    it('should generate a token for platform_admin', () => {
      const token = jwtUtils.generateToken(
        'superadmin',
        'super@platform.com',
        'platform_admin'
      );

      expect(token).toBe('mock.jwt.token');
    });

    it('should use default expiration when JWT_EXPIRE not set', () => {
      delete process.env.JWT_EXPIRE;

      jwtUtils.generateToken('user123', 'test@example.com', 'user');

      const jwt = require('jsonwebtoken');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test-secret-key',
        { expiresIn: '24h' }
      );
    });

    it('should throw error when JWT_SECRET not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        jwtUtils.generateToken('user123', 'test@example.com', 'user');
      }).toThrow('JWT_SECRET is not defined in environment variables');
    });
  });

  // ============================================
  // verifyToken() Tests
  // ============================================
  describe('verifyToken()', () => {
    it('should verify a valid token', () => {
      const decoded = jwtUtils.verifyToken('valid.token');

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe('user123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('user');
    });

    it('should return null for invalid token', () => {
      const decoded = jwtUtils.verifyToken('invalid.token');

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      const decoded = jwtUtils.verifyToken('expired.token');

      expect(decoded).toBeNull();
    });

    it('should return null when JWT_SECRET not defined', () => {
      delete process.env.JWT_SECRET;

      const decoded = jwtUtils.verifyToken('valid.token');

      // verifyToken catches the error from getJwtSecret and returns null
      expect(decoded).toBeNull();
    });
  });

  // ============================================
  // decodeToken() Tests
  // ============================================
  describe('decodeToken()', () => {
    it('should decode a valid token without verification', () => {
      const decoded = jwtUtils.decodeToken('valid.token');

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe('user123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should return null for invalid token format', () => {
      const jwt = require('jsonwebtoken');
      jwt.decode.mockReturnValueOnce(null);

      const decoded = jwtUtils.decodeToken('garbage-data');

      expect(decoded).toBeNull();
    });

    it('should decode expired token (without verification)', () => {
      const decoded = jwtUtils.decodeToken('expired.token');

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe('user123');
    });
  });

  // ============================================
  // isTokenExpired() Tests
  // ============================================
  describe('isTokenExpired()', () => {
    it('should return false for valid non-expired token', () => {
      const isExpired = jwtUtils.isTokenExpired('valid.token');

      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const isExpired = jwtUtils.isTokenExpired('expired.token');

      expect(isExpired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const jwt = require('jsonwebtoken');
      jwt.decode.mockReturnValueOnce(null);

      const isExpired = jwtUtils.isTokenExpired('garbage');

      expect(isExpired).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const jwt = require('jsonwebtoken');
      jwt.decode.mockReturnValueOnce({
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        iat: Date.now() / 1000,
        // No exp field
      });

      const isExpired = jwtUtils.isTokenExpired('no-exp.token');

      expect(isExpired).toBe(true);
    });
  });

  // ============================================
  // Default Export Tests
  // ============================================
  describe('Default Export', () => {
    it('should export all functions', () => {
      const defaultExport = jwtUtils.default;

      expect(defaultExport.generateToken).toBeDefined();
      expect(defaultExport.verifyToken).toBeDefined();
      expect(defaultExport.decodeToken).toBeDefined();
      expect(defaultExport.isTokenExpired).toBeDefined();
    });
  });
});

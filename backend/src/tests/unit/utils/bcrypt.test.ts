// bcrypt.test.ts (Member 8 - Testing Lead)
// Unit tests for Bcrypt utility functions
// Tests password hashing, comparison, and salt generation

import * as bcryptUtils from '../../../utils/bcrypt';

// Mock bcryptjs module
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('$2a$10$mockSalt'),
  hash: jest.fn().mockResolvedValue('$2a$10$hashedPassword'),
  compare: jest.fn().mockImplementation((candidate, hashed) => {
    return Promise.resolve(
      candidate === 'correctPassword' && hashed === '$2a$10$hashedPassword'
    );
  }),
}));

describe('Bcrypt Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // hashPassword() Tests
  // ============================================
  describe('hashPassword()', () => {
    it('should hash a password successfully', async () => {
      const hashedPassword = await bcryptUtils.hashPassword('myPassword123');

      expect(hashedPassword).toBe('$2a$10$hashedPassword');
      const bcrypt = require('bcryptjs');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'myPassword123',
        '$2a$10$mockSalt'
      );
    });

    it('should hash different passwords', async () => {
      const hash1 = await bcryptUtils.hashPassword('password1');
      const hash2 = await bcryptUtils.hashPassword('password2');

      // Both return mock value in test, but function is called correctly
      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
    });

    it('should throw error when hashing fails', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.genSalt.mockRejectedValueOnce(new Error('Salt generation failed'));

      await expect(bcryptUtils.hashPassword('password')).rejects.toThrow(
        'Error hashing password'
      );
    });

    it('should handle empty password', async () => {
      const hashedPassword = await bcryptUtils.hashPassword('');

      expect(hashedPassword).toBeDefined();
    });

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000);
      const hashedPassword = await bcryptUtils.hashPassword(longPassword);

      expect(hashedPassword).toBeDefined();
    });
  });

  // ============================================
  // comparePassword() Tests
  // ============================================
  describe('comparePassword()', () => {
    it('should return true for matching passwords', async () => {
      const isMatch = await bcryptUtils.comparePassword(
        'correctPassword',
        '$2a$10$hashedPassword'
      );

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const isMatch = await bcryptUtils.comparePassword(
        'wrongPassword',
        '$2a$10$hashedPassword'
      );

      expect(isMatch).toBe(false);
    });

    it('should return false on bcrypt error', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockRejectedValueOnce(new Error('Compare failed'));

      const isMatch = await bcryptUtils.comparePassword(
        'password',
        'invalidHash'
      );

      expect(isMatch).toBe(false);
    });

    it('should handle empty candidate password', async () => {
      const isMatch = await bcryptUtils.comparePassword(
        '',
        '$2a$10$hashedPassword'
      );

      expect(isMatch).toBe(false);
    });
  });

  // ============================================
  // generateSalt() Tests
  // ============================================
  describe('generateSalt()', () => {
    it('should generate salt with default rounds', async () => {
      const salt = await bcryptUtils.generateSalt();

      expect(salt).toBe('$2a$10$mockSalt');
      const bcrypt = require('bcryptjs');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    });

    it('should generate salt with custom rounds', async () => {
      const salt = await bcryptUtils.generateSalt(12);

      expect(salt).toBeDefined();
      const bcrypt = require('bcryptjs');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
    });

    it('should throw error when salt generation fails', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.genSalt.mockRejectedValueOnce(new Error('Salt generation failed'));

      await expect(bcryptUtils.generateSalt()).rejects.toThrow(
        'Error generating salt'
      );
    });
  });

  // ============================================
  // hashPasswordWithSalt() Tests
  // ============================================
  describe('hashPasswordWithSalt()', () => {
    it('should hash password with provided salt', async () => {
      const hashedPassword = await bcryptUtils.hashPasswordWithSalt(
        'password',
        '$2a$10$customSalt'
      );

      expect(hashedPassword).toBeDefined();
      const bcrypt = require('bcryptjs');
      expect(bcrypt.hash).toHaveBeenCalledWith('password', '$2a$10$customSalt');
    });

    it('should throw error when hashing with salt fails', async () => {
      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockRejectedValueOnce(new Error('Hash failed'));

      await expect(
        bcryptUtils.hashPasswordWithSalt('password', 'badSalt')
      ).rejects.toThrow('Error hashing password with salt');
    });
  });

  // ============================================
  // Default Export Tests
  // ============================================
  describe('Default Export', () => {
    it('should export all functions and constants', () => {
      const defaultExport = bcryptUtils.default;

      expect(defaultExport.hashPassword).toBeDefined();
      expect(defaultExport.comparePassword).toBeDefined();
      expect(defaultExport.generateSalt).toBeDefined();
      expect(defaultExport.hashPasswordWithSalt).toBeDefined();
      expect(defaultExport.SALT_ROUNDS).toBe(10);
    });
  });
});

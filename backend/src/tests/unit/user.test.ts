// user.test.ts (Member 1)
// Unit tests for User model
// Tests password hashing, comparePassword, generateAuthToken, and email validation

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../models/User';
import * as jwt from 'jsonwebtoken';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Test user data
const validUserData = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'user' as const,
};

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Clear database after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Model', () => {
  // ============================================
  // PASSWORD HASHING TESTS
  // ============================================
  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User(validUserData);
      await user.save();

      // Password should be hashed, not plain text
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalHash = user.password;

      // Update a field other than password
      user.firstName = 'Jane';
      await user.save();

      // Password hash should remain the same
      expect(user.password).toBe(originalHash);
    });

    it('should hash new password when password is updated', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalHash = user.password;

      // Update password
      user.password = 'newpassword456';
      await user.save();

      // Password hash should be different
      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe('newpassword456');
    });
  });

  // ============================================
  // COMPARE PASSWORD TESTS
  // ============================================
  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const user = new User(validUserData);
      await user.save();

      const isMatch = await user.comparePassword(validUserData.password);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User(validUserData);
      await user.save();

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const user = new User(validUserData);
      await user.save();

      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });
  });

  // ============================================
  // GENERATE AUTH TOKEN TESTS
  // ============================================
  describe('generateAuthToken Method', () => {
    beforeAll(() => {
      // Set JWT secret for testing
      process.env.JWT_SECRET = 'test-secret-key';
      process.env.JWT_EXPIRE = '1h';
    });

    it('should generate a valid JWT token', async () => {
      const user = new User(validUserData);
      await user.save();

      const token = user.generateAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user id, email, and role in token payload', async () => {
      const user = new User(validUserData);
      await user.save();

      const token = user.generateAuthToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
        role: string;
      };

      expect(decoded.id).toBe(user._id.toString());
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should generate token with expiration', async () => {
      const user = new User(validUserData);
      await user.save();

      const token = user.generateAuthToken();
      const decoded = jwt.decode(token) as { exp: number; iat: number };

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });

  // ============================================
  // EMAIL VALIDATION TESTS
  // ============================================
  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user123@test.co',
      ];

      for (const email of validEmails) {
        const user = new User({ ...validUserData, email });
        await expect(user.validate()).resolves.toBeUndefined();
        await User.deleteMany({}); // Clean up for next iteration
      }
    });

    it('should reject invalid email addresses', async () => {
      const invalidEmails = ['invalid', 'invalid@', '@domain.com', 'test@.com'];

      for (const email of invalidEmails) {
        const user = new User({ ...validUserData, email });
        await expect(user.validate()).rejects.toThrow();
      }
    });

    it('should require email field', async () => {
      const userWithoutEmail = new User({
        ...validUserData,
        email: undefined,
      });

      await expect(userWithoutEmail.validate()).rejects.toThrow(
        'Email is required'
      );
    });

    it('should convert email to lowercase', async () => {
      const user = new User({
        ...validUserData,
        email: 'TEST@EXAMPLE.COM',
      });
      await user.save();

      expect(user.email).toBe('test@example.com');
    });

    it('should enforce unique email addresses', async () => {
      const user1 = new User(validUserData);
      await user1.save();

      const user2 = new User(validUserData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  // ============================================
  // FIELD VALIDATION TESTS
  // ============================================
  describe('Field Validation', () => {
    it('should require firstName', async () => {
      const user = new User({ ...validUserData, firstName: undefined });
      await expect(user.validate()).rejects.toThrow('First name is required');
    });

    it('should require lastName', async () => {
      const user = new User({ ...validUserData, lastName: undefined });
      await expect(user.validate()).rejects.toThrow('Last name is required');
    });

    it('should require password', async () => {
      const user = new User({ ...validUserData, password: undefined });
      await expect(user.validate()).rejects.toThrow('Password is required');
    });

    it('should require password minimum length of 6', async () => {
      const user = new User({ ...validUserData, password: '12345' });
      await expect(user.validate()).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should default role to user', async () => {
      const userData = { ...validUserData };
      delete (userData as Partial<typeof validUserData>).role;
      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('user');
    });

    it('should default isActive to true', async () => {
      const user = new User(validUserData);
      await user.save();

      expect(user.isActive).toBe(true);
    });

    it('should only accept valid role values', async () => {
      const user = new User({ ...validUserData, role: 'invalid_role' });
      await expect(user.validate()).rejects.toThrow();
    });
  });

  // ============================================
  // TIMESTAMPS TESTS
  // ============================================
  describe('Timestamps', () => {
    it('should add createdAt and updatedAt on save', async () => {
      const user = new User(validUserData);
      await user.save();

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const user = new User(validUserData);
      await user.save();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      user.firstName = 'Jane';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });
});

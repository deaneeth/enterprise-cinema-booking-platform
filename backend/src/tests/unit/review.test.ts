// review.test.ts (Member 8)
// Unit tests for Review model
// Tests schema validation, instance methods, static methods, and indexes

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Review from '../../models/Review';
import User from '../../models/User';
import Movie from '../../models/Movie';
import Cinema from '../../models/Cinema';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Test data
let testUser: any;
let testMovie: any;
let testCinema: any;

const validReviewData = {
  rating: 4,
  comment: 'Great movie experience!',
  isVerifiedBooking: false,
  isActive: true,
};

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user
  testUser = await User.create({
    email: 'reviewer@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Reviewer',
    role: 'user',
  });

  // Create test movie
  testMovie = await Movie.create({
    title: 'Test Movie',
    description: 'A test movie for reviews',
    duration: 120,
    genre: ['Action'],
    rating: 'PG-13',
    releaseDate: new Date(),
    posterUrl: 'https://example.com/poster.jpg',
    isActive: true,
  });

  // Create test cinema
  testCinema = await Cinema.create({
    name: 'Test Cinema',
    location: {
      address: '123 Test St',
      city: 'Test City',
    },
    facilities: ['Parking', 'Cafe'],
    screens: 5,
    isActive: true,
  });
});

// Cleanup: Clear reviews after each test
afterEach(async () => {
  await Review.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await User.deleteMany({});
  await Movie.deleteMany({});
  await Cinema.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Review Model', () => {
  // ============================================
  // SCHEMA VALIDATION TESTS
  // ============================================
  describe('Schema Validation', () => {
    it('should create a valid review for a movie', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      await expect(review.save()).resolves.toBeDefined();
      expect(review._id).toBeDefined();
      expect(review.rating).toBe(4);
      expect(review.targetType).toBe('movie');
    });

    it('should create a valid review for a cinema', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'cinema',
        targetId: testCinema._id,
      });

      await expect(review.save()).resolves.toBeDefined();
      expect(review.targetType).toBe('cinema');
    });

    it('should require userId', async () => {
      const review = new Review({
        ...validReviewData,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      await expect(review.validate()).rejects.toThrow('User ID is required');
    });

    it('should require targetType', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetId: testMovie._id,
      });

      await expect(review.validate()).rejects.toThrow(
        'Target type is required'
      );
    });

    it('should require targetId', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
      });

      await expect(review.validate()).rejects.toThrow('Target ID is required');
    });

    it('should require rating', async () => {
      const review = new Review({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        comment: 'Nice movie',
      });

      await expect(review.validate()).rejects.toThrow('Rating is required');
    });

    it('should reject rating below 1', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 0,
      });

      await expect(review.validate()).rejects.toThrow(
        'Rating must be at least 1'
      );
    });

    it('should reject rating above 5', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 6,
      });

      await expect(review.validate()).rejects.toThrow(
        'Rating must be at most 5'
      );
    });

    it('should accept rating values 1 through 5', async () => {
      for (let rating = 1; rating <= 5; rating++) {
        const review = new Review({
          userId: testUser._id,
          targetType: 'movie',
          targetId: testMovie._id,
          rating,
        });
        await expect(review.validate()).resolves.toBeUndefined();
      }
    });

    it('should reject invalid targetType', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'invalid' as any,
        targetId: testMovie._id,
      });

      await expect(review.validate()).rejects.toThrow(
        'Target type must be either movie or cinema'
      );
    });

    it('should allow optional comment', async () => {
      const review = new Review({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        // No comment provided
      });

      await expect(review.save()).resolves.toBeDefined();
      expect(review.comment).toBeUndefined();
    });

    it('should reject comment exceeding 1000 characters', async () => {
      const longComment = 'a'.repeat(1001);
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        comment: longComment,
      });

      await expect(review.validate()).rejects.toThrow(
        'Comment cannot exceed 1000 characters'
      );
    });

    it('should trim comment whitespace', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        comment: '  Great movie!  ',
      });

      await review.save();
      expect(review.comment).toBe('Great movie!');
    });

    it('should default isVerifiedBooking to false', async () => {
      const review = new Review({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
      });

      await review.save();
      expect(review.isVerifiedBooking).toBe(false);
    });

    it('should default isActive to true', async () => {
      const review = new Review({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
      });

      await review.save();
      expect(review.isActive).toBe(true);
    });
  });

  // ============================================
  // INSTANCE METHOD TESTS
  // ============================================
  describe('canEdit Method', () => {
    it('should return true for the review owner', async () => {
      const review = await Review.create({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      const canEdit = review.canEdit(testUser._id);
      expect(canEdit).toBe(true);
    });

    it('should return true when passing userId as string', async () => {
      const review = await Review.create({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      const canEdit = review.canEdit(testUser._id.toString());
      expect(canEdit).toBe(true);
    });

    it('should return false for a different user', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        role: 'user',
      });

      const review = await Review.create({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      const canEdit = review.canEdit(otherUser._id);
      expect(canEdit).toBe(false);

      await User.findByIdAndDelete(otherUser._id);
    });
  });

  // ============================================
  // STATIC METHOD TESTS
  // ============================================
  describe('getAverageRating Static Method', () => {
    it('should return 0 average and 0 total when no reviews exist', async () => {
      const result = await Review.getAverageRating(testMovie._id, 'movie');

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });

    it('should calculate average rating correctly for a single review', async () => {
      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        isActive: true,
      });

      const result = await Review.getAverageRating(testMovie._id, 'movie');

      expect(result.averageRating).toBe(5);
      expect(result.totalReviews).toBe(1);
    });

    it('should calculate average rating correctly for multiple reviews', async () => {
      // Create additional users for unique reviews
      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
        role: 'user',
      });

      const user3 = await User.create({
        email: 'user3@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Three',
        role: 'user',
      });

      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        isActive: true,
      });

      await Review.create({
        userId: user2._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
        isActive: true,
      });

      await Review.create({
        userId: user3._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 3,
        isActive: true,
      });

      const result = await Review.getAverageRating(testMovie._id, 'movie');

      // (5 + 4 + 3) / 3 = 4
      expect(result.averageRating).toBe(4);
      expect(result.totalReviews).toBe(3);

      // Cleanup
      await User.findByIdAndDelete(user2._id);
      await User.findByIdAndDelete(user3._id);
    });

    it('should only include active reviews in the calculation', async () => {
      const user2 = await User.create({
        email: 'inactive@example.com',
        password: 'password123',
        firstName: 'Inactive',
        lastName: 'User',
        role: 'user',
      });

      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        isActive: true,
      });

      await Review.create({
        userId: user2._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 1,
        isActive: false, // This review should be excluded
      });

      const result = await Review.getAverageRating(testMovie._id, 'movie');

      expect(result.averageRating).toBe(5);
      expect(result.totalReviews).toBe(1);

      await User.findByIdAndDelete(user2._id);
    });

    it('should round average rating to one decimal place', async () => {
      const user2 = await User.create({
        email: 'decimal@example.com',
        password: 'password123',
        firstName: 'Decimal',
        lastName: 'User',
        role: 'user',
      });

      const user3 = await User.create({
        email: 'decimal2@example.com',
        password: 'password123',
        firstName: 'Decimal2',
        lastName: 'User',
        role: 'user',
      });

      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        isActive: true,
      });

      await Review.create({
        userId: user2._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
        isActive: true,
      });

      await Review.create({
        userId: user3._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
        isActive: true,
      });

      const result = await Review.getAverageRating(testMovie._id, 'movie');

      // (5 + 4 + 4) / 3 = 4.333... rounds to 4.3
      expect(result.averageRating).toBe(4.3);

      await User.findByIdAndDelete(user2._id);
      await User.findByIdAndDelete(user3._id);
    });

    it('should calculate separate averages for different target types', async () => {
      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
        isActive: true,
      });

      await Review.create({
        userId: testUser._id,
        targetType: 'cinema',
        targetId: testCinema._id,
        rating: 3,
        isActive: true,
      });

      const movieResult = await Review.getAverageRating(testMovie._id, 'movie');
      const cinemaResult = await Review.getAverageRating(
        testCinema._id,
        'cinema'
      );

      expect(movieResult.averageRating).toBe(5);
      expect(cinemaResult.averageRating).toBe(3);
    });
  });

  // ============================================
  // UNIQUE INDEX TESTS
  // ============================================
  describe('Unique User-Target Index', () => {
    it('should prevent duplicate reviews from same user for same target', async () => {
      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
      });

      const duplicateReview = new Review({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
      });

      await expect(duplicateReview.save()).rejects.toThrow();
    });

    it('should allow same user to review different targets', async () => {
      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
      });

      const cinemaReview = new Review({
        userId: testUser._id,
        targetType: 'cinema',
        targetId: testCinema._id,
        rating: 5,
      });

      await expect(cinemaReview.save()).resolves.toBeDefined();
    });

    it('should allow different users to review same target', async () => {
      const user2 = await User.create({
        email: 'different@example.com',
        password: 'password123',
        firstName: 'Different',
        lastName: 'User',
        role: 'user',
      });

      await Review.create({
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 4,
      });

      const review2 = new Review({
        userId: user2._id,
        targetType: 'movie',
        targetId: testMovie._id,
        rating: 5,
      });

      await expect(review2.save()).resolves.toBeDefined();

      await User.findByIdAndDelete(user2._id);
    });
  });

  // ============================================
  // TIMESTAMPS TESTS
  // ============================================
  describe('Timestamps', () => {
    it('should add createdAt and updatedAt on save', async () => {
      const review = new Review({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      await review.save();

      expect(review.createdAt).toBeDefined();
      expect(review.updatedAt).toBeDefined();
      expect(review.createdAt).toBeInstanceOf(Date);
      expect(review.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const review = await Review.create({
        ...validReviewData,
        userId: testUser._id,
        targetType: 'movie',
        targetId: testMovie._id,
      });

      const originalUpdatedAt = review.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      review.rating = 5;
      await review.save();

      expect(review.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });
});

// booking.test.ts (Member 5)
// Unit tests for the Booking model
// Tests schema validation, instance methods, and model behavior

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals';
import Booking from '../../models/Booking';
import User from '../../models/User';
import Showtime from '../../models/Showtime';
import Cinema from '../../models/Cinema';
import Movie from '../../models/Movie';

let mongoServer: MongoMemoryServer;

// Setup: Start in-memory MongoDB
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.QR_SECRET = 'test-qr-secret';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

// Cleanup: Clear database after each test
afterEach(async () => {
  await Promise.all([
    Booking.deleteMany({}),
    User.deleteMany({}),
    Showtime.deleteMany({}),
    Cinema.deleteMany({}),
    Movie.deleteMany({}),
  ]);
});

// Teardown: Disconnect and stop MongoDB
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Booking Model', () => {
  // Helper to create test data
  const createTestData = async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    const cinema = await Cinema.create({
      name: 'Test Cinema',
    });

    const movie = await Movie.create({
      title: 'Test Movie',
      duration: 120,
      isActive: true,
    });

    // Create showtime in the future
    const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
    const showtime = await Showtime.create({
      movieId: movie._id,
      cinemaId: cinema._id,
      screenNumber: 1,
      startTime: futureTime,
      endTime: new Date(futureTime.getTime() + 120 * 60 * 1000),
      date: futureTime,
      price: 1000,
      totalSeats: 100,
      availableSeats: 100,
      isActive: true,
    });

    return { user, cinema, movie, showtime };
  };

  // ============================================
  // Schema Validation Tests
  // ============================================

  describe('Schema Validation', () => {
    it('should create a booking with required fields', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      expect(booking._id).toBeDefined();
      expect(booking.userId.toString()).toBe(user._id.toString());
      expect(booking.showtimeId.toString()).toBe(showtime._id.toString());
      expect(booking.seatIds).toHaveLength(1);
      expect(booking.numberOfSeats).toBe(1);
      expect(booking.totalAmount).toBe(1000);
      expect(booking.bookingStatus).toBe('pending'); // default value
      expect(booking.bookingDate).toBeDefined();
    });

    it('should fail without userId', async () => {
      const { showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      await expect(
        Booking.create({
          showtimeId: showtime._id,
          seatIds: [seatId],
          numberOfSeats: 1,
          totalAmount: 1000,
        })
      ).rejects.toThrow(/User ID is required/);
    });

    it('should fail without showtimeId', async () => {
      const { user } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      await expect(
        Booking.create({
          userId: user._id,
          seatIds: [seatId],
          numberOfSeats: 1,
          totalAmount: 1000,
        })
      ).rejects.toThrow(/Showtime ID is required/);
    });

    it('should fail with empty seatIds array', async () => {
      const { user, showtime } = await createTestData();

      await expect(
        Booking.create({
          userId: user._id,
          showtimeId: showtime._id,
          seatIds: [],
          numberOfSeats: 1,
          totalAmount: 1000,
        })
      ).rejects.toThrow(/At least one seat must be selected/);
    });

    it('should fail with invalid booking status', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      await expect(
        Booking.create({
          userId: user._id,
          showtimeId: showtime._id,
          seatIds: [seatId],
          numberOfSeats: 1,
          totalAmount: 1000,
          bookingStatus: 'invalid_status' as never,
        })
      ).rejects.toThrow(
        /Booking status must be pending, confirmed, cancelled, or expired/
      );
    });

    it('should accept valid booking statuses', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const confirmedBooking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
        bookingStatus: 'confirmed',
      });

      expect(confirmedBooking.bookingStatus).toBe('confirmed');
    });
  });

  // ============================================
  // Instance Method Tests
  // ============================================

  describe('generateQRCode()', () => {
    it('should generate a unique QR code string', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      const qrCode = booking.generateQRCode();

      expect(qrCode).toBeDefined();
      expect(typeof qrCode).toBe('string');
      expect(qrCode).toMatch(/^BOOK-[A-Z0-9]{6}-[A-Z0-9]{16}$/);
      expect(booking.qrCode).toBe(qrCode);
    });

    it('should generate different QR codes for different bookings', async () => {
      const { user, showtime, cinema, movie } = await createTestData();

      // Create a second showtime to avoid unique pending booking constraint
      const futureTime2 = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now
      const showtime2 = await Showtime.create({
        movieId: movie._id,
        cinemaId: cinema._id,
        screenNumber: 2,
        startTime: futureTime2,
        endTime: new Date(futureTime2.getTime() + 120 * 60 * 1000),
        date: futureTime2,
        price: 1000,
        totalSeats: 100,
        availableSeats: 100,
        isActive: true,
      });

      const booking1 = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [new mongoose.Types.ObjectId()],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      const booking2 = await Booking.create({
        userId: user._id,
        showtimeId: showtime2._id,
        seatIds: [new mongoose.Types.ObjectId()],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      const qr1 = booking1.generateQRCode();
      const qr2 = booking2.generateQRCode();

      expect(qr1).not.toBe(qr2);
    });
  });

  describe('canCancel()', () => {
    it('should return true for future showtime bookings', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
        bookingStatus: 'confirmed',
      });

      const canCancel = await booking.canCancel();
      expect(canCancel).toBe(true);
    });

    it('should return false for past showtime bookings', async () => {
      const { user, cinema, movie } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      // Create showtime in the past
      const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const pastShowtime = await Showtime.create({
        movieId: movie._id,
        cinemaId: cinema._id,
        screenNumber: 2,
        startTime: pastTime,
        endTime: new Date(pastTime.getTime() + 120 * 60 * 1000),
        date: pastTime,
        price: 1000,
        totalSeats: 100,
        availableSeats: 100,
        isActive: true,
      });

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: pastShowtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
        bookingStatus: 'confirmed',
      });

      const canCancel = await booking.canCancel();
      expect(canCancel).toBe(false);
    });

    it('should return false for already cancelled bookings', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
        bookingStatus: 'cancelled',
      });

      const canCancel = await booking.canCancel();
      expect(canCancel).toBe(false);
    });

    it('should return false for non-existent showtime', async () => {
      const { user } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();
      const fakeShowtimeId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: fakeShowtimeId,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      const canCancel = await booking.canCancel();
      expect(canCancel).toBe(false);
    });
  });

  // ============================================
  // Timestamps and Defaults
  // ============================================

  describe('Timestamps and Defaults', () => {
    it('should have createdAt and updatedAt timestamps', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      expect(booking.createdAt).toBeDefined();
      expect(booking.updatedAt).toBeDefined();
      expect(booking.createdAt).toBeInstanceOf(Date);
      expect(booking.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default bookingDate to now', async () => {
      const { user, showtime } = await createTestData();
      const seatId = new mongoose.Types.ObjectId();
      const beforeCreate = new Date();

      const booking = await Booking.create({
        userId: user._id,
        showtimeId: showtime._id,
        seatIds: [seatId],
        numberOfSeats: 1,
        totalAmount: 1000,
      });

      const afterCreate = new Date();

      expect(booking.bookingDate).toBeDefined();
      expect(booking.bookingDate.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime()
      );
      expect(booking.bookingDate.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime()
      );
    });
  });
});

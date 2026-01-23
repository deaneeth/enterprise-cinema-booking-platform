// seatCleanup.test.ts (Member 8 - Testing Lead)
// Unit tests for Seat Cleanup service
// Tests booking expiry, payment cleanup, and scheduled job functions

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock the websocket and audit services
jest.mock('../../../services/websocket', () => ({
  __esModule: true,
  default: {
    broadcastSeatsRefresh: jest.fn(),
  },
}));

jest.mock('../../../services/audit', () => ({
  __esModule: true,
  default: {
    logHoldExpired: jest.fn(),
  },
}));

// Mock the Booking model
jest.mock('../../../models/Booking', () => {
  const mongoose = require('mongoose');

  const bookingSchema = new mongoose.Schema({
    bookingStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: Date,
    seatIds: [mongoose.Schema.Types.ObjectId],
    showtimeId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
  });

  // Return the model or create it if not exists
  const getModel = () => {
    try {
      return mongoose.model('Booking');
    } catch {
      return mongoose.model('Booking', bookingSchema);
    }
  };

  return {
    __esModule: true,
    default: getModel(),
  };
});

import seatCleanupService, {
  expirePendingBookings,
  checkAndExpireBooking,
  cleanupStalePayments,
  startCleanupJob,
  stopCleanupJob,
  syncAllConfirmedBookingSeats,
} from '../../../services/seatCleanup';

let mongoServer: MongoMemoryServer;

// Create mock models for testing
const createMockBooking = (status: string, expiresAt: Date) => ({
  _id: new mongoose.Types.ObjectId(),
  bookingStatus: status,
  expiresAt,
  createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
  seatIds: [new mongoose.Types.ObjectId()],
  showtimeId: new mongoose.Types.ObjectId(),
  save: jest.fn().mockResolvedValue(true),
});

describe('Seat Cleanup Service', () => {
  let consoleSpy: jest.SpyInstance;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create minimal models for Seat and Payment (Booking is mocked)
    const seatSchema = new mongoose.Schema({
      status: { type: String, enum: ['available', 'held', 'booked'] },
      heldBy: mongoose.Schema.Types.ObjectId,
      heldUntil: Date,
      bookingId: mongoose.Schema.Types.ObjectId,
    });

    const paymentSchema = new mongoose.Schema({
      paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
      },
      bookingId: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
    });

    // Only create models if they don't exist
    if (!mongoose.models.Seat) {
      mongoose.model('Seat', seatSchema);
    }
    if (!mongoose.models.Payment) {
      mongoose.model('Payment', paymentSchema);
    }
  });

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();

    // Clean up test data
    const Booking = mongoose.model('Booking');
    const Seat = mongoose.model('Seat');
    const Payment = mongoose.model('Payment');
    await Booking.deleteMany({});
    await Seat.deleteMany({});
    await Payment.deleteMany({});
  });

  afterAll(async () => {
    stopCleanupJob();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // ============================================
  // expirePendingBookings() Tests
  // ============================================
  describe('expirePendingBookings()', () => {
    it('should return 0 when no expired bookings exist', async () => {
      const count = await expirePendingBookings();
      expect(count).toBe(0);
    });

    it('should expire pending bookings that have passed expiry time', async () => {
      const Booking = mongoose.model('Booking');
      const expiredTime = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago

      await Booking.create({
        bookingStatus: 'pending',
        expiresAt: expiredTime,
        seatIds: [],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      const count = await expirePendingBookings();

      expect(count).toBe(1);

      const updated = await Booking.findOne({});
      expect(updated?.bookingStatus).toBe('expired');
    });

    it('should not expire bookings that have not passed expiry time', async () => {
      const Booking = mongoose.model('Booking');
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 min in future

      await Booking.create({
        bookingStatus: 'pending',
        expiresAt: futureTime,
        seatIds: [],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      const count = await expirePendingBookings();

      expect(count).toBe(0);

      const booking = await Booking.findOne({});
      expect(booking?.bookingStatus).toBe('pending');
    });

    it('should release held seats for expired bookings', async () => {
      const Booking = mongoose.model('Booking');
      const Seat = mongoose.model('Seat');

      const seatId = new mongoose.Types.ObjectId();
      const expiredTime = new Date(Date.now() - 5 * 60 * 1000);

      await Seat.create({
        _id: seatId,
        status: 'held',
        heldBy: new mongoose.Types.ObjectId(),
        heldUntil: expiredTime,
      });

      await Booking.create({
        bookingStatus: 'pending',
        expiresAt: expiredTime,
        seatIds: [seatId],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      await expirePendingBookings();

      const seat = await Seat.findById(seatId);
      expect(seat?.status).toBe('available');
      expect(seat?.heldBy).toBeNull();
    });

    it('should cancel pending payments for expired bookings', async () => {
      const Booking = mongoose.model('Booking');
      const Payment = mongoose.model('Payment');

      const bookingId = new mongoose.Types.ObjectId();
      const expiredTime = new Date(Date.now() - 5 * 60 * 1000);

      await Booking.create({
        _id: bookingId,
        bookingStatus: 'pending',
        expiresAt: expiredTime,
        seatIds: [],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      await Payment.create({
        bookingId,
        paymentStatus: 'pending',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      });

      await expirePendingBookings();

      const payment = await Payment.findOne({ bookingId });
      expect(payment?.paymentStatus).toBe('cancelled');
    });

    it('should broadcast websocket refresh for affected showtimes', async () => {
      const Booking = mongoose.model('Booking');
      const websocketService = require('../../../services/websocket').default;

      const showtimeId = new mongoose.Types.ObjectId();
      const expiredTime = new Date(Date.now() - 5 * 60 * 1000);

      await Booking.create({
        bookingStatus: 'pending',
        expiresAt: expiredTime,
        seatIds: [],
        showtimeId,
      });

      await expirePendingBookings();

      expect(websocketService.broadcastSeatsRefresh).toHaveBeenCalledWith(
        showtimeId.toString()
      );
    });

    it('should log audit events for expired bookings', async () => {
      const Booking = mongoose.model('Booking');
      const auditService = require('../../../services/audit').default;

      const expiredTime = new Date(Date.now() - 5 * 60 * 1000);

      await Booking.create({
        bookingStatus: 'pending',
        expiresAt: expiredTime,
        seatIds: [],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      await expirePendingBookings();

      expect(auditService.logHoldExpired).toHaveBeenCalled();
    });
  });

  // ============================================
  // checkAndExpireBooking() Tests
  // ============================================
  describe('checkAndExpireBooking()', () => {
    it('should return confirmed booking unchanged', async () => {
      const mockBooking = createMockBooking('confirmed', new Date());
      mockBooking.bookingStatus = 'confirmed';

      const result = await checkAndExpireBooking(mockBooking as any);

      expect(result.bookingStatus).toBe('confirmed');
      expect(mockBooking.save).not.toHaveBeenCalled();
    });

    it('should return cancelled booking unchanged', async () => {
      const mockBooking = createMockBooking('cancelled', new Date());
      mockBooking.bookingStatus = 'cancelled';

      const result = await checkAndExpireBooking(mockBooking as any);

      expect(result.bookingStatus).toBe('cancelled');
    });

    it('should return non-expired pending booking unchanged', async () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000);
      const mockBooking = createMockBooking('pending', futureExpiry);

      const result = await checkAndExpireBooking(mockBooking as any);

      expect(result.bookingStatus).toBe('pending');
      expect(mockBooking.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // cleanupStalePayments() Tests
  // ============================================
  describe('cleanupStalePayments()', () => {
    it('should cancel stale pending payments older than 1 hour', async () => {
      const Payment = mongoose.model('Payment');

      await Payment.create({
        paymentStatus: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        bookingId: new mongoose.Types.ObjectId(),
      });

      const count = await cleanupStalePayments();

      expect(count).toBe(1);

      const payment = await Payment.findOne({});
      expect(payment?.paymentStatus).toBe('cancelled');
    });

    it('should not cancel recent pending payments', async () => {
      const Payment = mongoose.model('Payment');

      await Payment.create({
        paymentStatus: 'pending',
        createdAt: new Date(), // Just created
        bookingId: new mongoose.Types.ObjectId(),
      });

      const count = await cleanupStalePayments();

      expect(count).toBe(0);

      const payment = await Payment.findOne({});
      expect(payment?.paymentStatus).toBe('pending');
    });

    it('should not affect completed payments', async () => {
      const Payment = mongoose.model('Payment');

      await Payment.create({
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        bookingId: new mongoose.Types.ObjectId(),
      });

      const count = await cleanupStalePayments();

      expect(count).toBe(0);

      const payment = await Payment.findOne({});
      expect(payment?.paymentStatus).toBe('completed');
    });
  });

  // ============================================
  // syncAllConfirmedBookingSeats() Tests
  // ============================================
  describe('syncAllConfirmedBookingSeats()', () => {
    it('should sync seats for confirmed bookings', async () => {
      const Booking = mongoose.model('Booking');
      const Seat = mongoose.model('Seat');

      const seatId = new mongoose.Types.ObjectId();
      const bookingId = new mongoose.Types.ObjectId();

      await Seat.create({
        _id: seatId,
        status: 'held', // Out of sync - should be 'booked'
      });

      await Booking.create({
        _id: bookingId,
        bookingStatus: 'confirmed',
        seatIds: [seatId],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      await syncAllConfirmedBookingSeats();

      const seat = await Seat.findById(seatId);
      expect(seat?.status).toBe('booked');
    });

    it('should not modify already booked seats', async () => {
      const Booking = mongoose.model('Booking');
      const Seat = mongoose.model('Seat');

      const seatId = new mongoose.Types.ObjectId();
      const bookingId = new mongoose.Types.ObjectId();

      await Seat.create({
        _id: seatId,
        status: 'booked',
        bookingId,
      });

      await Booking.create({
        _id: bookingId,
        bookingStatus: 'confirmed',
        seatIds: [seatId],
        showtimeId: new mongoose.Types.ObjectId(),
      });

      await syncAllConfirmedBookingSeats();

      const seat = await Seat.findById(seatId);
      expect(seat?.status).toBe('booked');
    });
  });

  // ============================================
  // startCleanupJob / stopCleanupJob Tests
  // ============================================
  describe('Cleanup Job Lifecycle', () => {
    it('should start cleanup job', () => {
      startCleanupJob();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Cleanup] Starting cleanup job')
      );
    });

    it('should stop cleanup job', () => {
      startCleanupJob();
      stopCleanupJob();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SeatCleanup] Cleanup job stopped'
      );
    });

    it('should not start duplicate cleanup jobs', () => {
      startCleanupJob();
      startCleanupJob();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SeatCleanup] Cleanup job already running'
      );

      stopCleanupJob();
    });
  });

  // ============================================
  // Default Export Tests
  // ============================================
  describe('Default Export', () => {
    it('should export all functions', () => {
      expect(seatCleanupService.expirePendingBookings).toBeDefined();
      expect(seatCleanupService.startCleanupJob).toBeDefined();
      expect(seatCleanupService.stopCleanupJob).toBeDefined();
      expect(seatCleanupService.checkAndExpireBooking).toBeDefined();
      expect(seatCleanupService.syncAllConfirmedBookingSeats).toBeDefined();
      expect(seatCleanupService.cleanupStalePayments).toBeDefined();
    });
  });
});

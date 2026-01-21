// payments.test.ts (Member 7)
// Integration tests for payment endpoints
// Tests PayPal order creation, capture, refund, and payment management

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  beforeAll,
  afterEach,
  afterAll,
  describe,
  it,
  expect,
  jest,
  beforeEach,
} from '@jest/globals';
import { app } from '../../server';
import User from '../../models/User';
import Movie from '../../models/Movie';
import Cinema from '../../models/Cinema';
import Showtime from '../../models/Showtime';
import Booking from '../../models/Booking';
import Payment from '../../models/Payment';

// Mock WebSocket service to avoid actual socket connections
jest.mock('../../services/websocket', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    broadcastSeatUpdate: jest.fn(),
    broadcastSeatsRefresh: jest.fn(),
    broadcastBookingConfirmed: jest.fn(),
    broadcastShowtimeUpdate: jest.fn(),
    broadcastShowtimeUpdated: jest.fn(),
    notifyCinemaAdmin: jest.fn(),
    emitToUser: jest.fn(),
  },
}));

// Mock PayPal service for testing
jest.mock('../../services/payment', () => ({
  __esModule: true,
  default: {
    createOrder: jest.fn(),
    capturePayment: jest.fn(),
    processRefund: jest.fn(),
    getOrderDetails: jest.fn(),
  },
}));

// Import mocked PayPal service
import paypalService from '../../services/payment';

// Type the mocked service using jest.mocked
const mockedPaypalService = {
  createOrder: paypalService.createOrder as jest.MockedFunction<
    typeof paypalService.createOrder
  >,
  capturePayment: paypalService.capturePayment as jest.MockedFunction<
    typeof paypalService.capturePayment
  >,
  processRefund: paypalService.processRefund as jest.MockedFunction<
    typeof paypalService.processRefund
  >,
  getOrderDetails: paypalService.getOrderDetails as jest.MockedFunction<
    typeof paypalService.getOrderDetails
  >,
};

let mongoServer: MongoMemoryServer;

/* =======================
  Helper Functions
======================= */

/**
 * Create a user and generate auth token
 */
const createUserWithToken = async (
  overrides?: Partial<{
    role: 'user' | 'cinema_admin' | 'platform_admin';
    cinemaId?: mongoose.Types.ObjectId;
    email?: string;
  }>
) => {
  const user = new User({
    email:
      overrides?.email || `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: overrides?.role ?? 'user',
    cinemaId: overrides?.cinemaId,
    isActive: true,
  });
  await user.save();
  return { user, token: user.generateAuthToken() };
};

/**
 * Generate valid MongoDB ObjectIds for seats
 */
const generateSeatIds = (count: number): mongoose.Types.ObjectId[] => {
  return Array.from({ length: count }, () => new mongoose.Types.ObjectId());
};

/**
 * Create test movie, cinema, and showtime
 */
const createTestShowtime = async (cinemaId: mongoose.Types.ObjectId) => {
  const movie = await Movie.create({
    title: `Test Movie ${Date.now()}`,
    duration: 120,
    isActive: true,
  });

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
  const endTime = new Date(startTime.getTime() + 120 * 60 * 1000); // 2 hours after start

  const showtime = await Showtime.create({
    movieId: movie._id,
    cinemaId: cinemaId,
    screenNumber: 1,
    date: startTime, // Required field
    startTime: startTime,
    endTime: endTime, // Required field
    price: 15.0,
    format: '2D',
    totalSeats: 50,
    availableSeats: 50,
    isActive: true,
  });

  return { movie, showtime };
};

/**
 * Create a test booking
 */
const createTestBooking = async (
  userId: mongoose.Types.ObjectId,
  showtimeId: mongoose.Types.ObjectId,
  options?: {
    status?: 'pending' | 'confirmed' | 'cancelled';
    totalAmount?: number;
    expiresAt?: Date;
  }
) => {
  const seatIds = generateSeatIds(2);
  const booking = await Booking.create({
    userId,
    showtimeId,
    seatIds,
    numberOfSeats: seatIds.length,
    totalAmount: options?.totalAmount ?? 30.0,
    bookingStatus: options?.status ?? 'pending',
    bookingDate: new Date(),
    expiresAt: options?.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000),
  });
  return booking;
};

/**
 * Create a test payment
 */
const createTestPayment = async (
  bookingId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  options?: {
    status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    paypalOrderId?: string;
    paypalCaptureId?: string;
    amount?: number;
  }
) => {
  const payment = await Payment.create({
    bookingId,
    userId,
    amount: options?.amount ?? 30.0,
    currency: 'USD',
    paymentMethod: 'paypal',
    paymentStatus: options?.status ?? 'pending',
    paypalOrderId: options?.paypalOrderId ?? `ORDER-${Date.now()}`,
    paypalCaptureId: options?.paypalCaptureId,
    paymentDate: options?.status === 'completed' ? new Date() : undefined,
  });
  return payment;
};

/* =======================
  Test Setup and Teardown
======================= */

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
  process.env.PAYPAL_MODE = 'sandbox';
  process.env.FRONTEND_URL = 'http://localhost:3000';

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Cinema.deleteMany({}),
    Showtime.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

/* =======================
  Payment Integration Tests
======================= */

describe('Payment API', () => {
  /* =======================
    POST /api/payments/create-order
  ======================= */
  describe('POST /api/payments/create-order', () => {
    it('should create PayPal order for valid pending booking', async () => {
      // Setup
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      // Mock PayPal service
      const mockOrderId = 'PAYPAL-ORDER-123';
      const mockApprovalUrl =
        'https://sandbox.paypal.com/checkout?token=PAYPAL-ORDER-123';
      mockedPaypalService.createOrder.mockResolvedValue({
        orderId: mockOrderId,
        approvalUrl: mockApprovalUrl,
      });

      // Execute
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: booking._id.toString() })
        .expect(200);

      // Assert response
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe(mockOrderId);
      expect(res.body.data.approvalUrl).toBeDefined();

      // Assert Payment record created
      const payment = await Payment.findOne({ bookingId: booking._id });
      expect(payment).toBeDefined();
      expect(payment?.paymentStatus).toBe('pending');
      expect(payment?.paypalOrderId).toBe(mockOrderId);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/payments/create-order')
        .send({ bookingId: new mongoose.Types.ObjectId().toString() })
        .expect(401);
    });

    it('should reject if booking not found', async () => {
      const { token } = await createUserWithToken();
      const fakeBookingId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: fakeBookingId })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });

    it('should reject if booking not pending', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id, {
        status: 'confirmed',
      });

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: booking._id.toString() })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('confirmed');
    });

    it('should reject if booking belongs to different user', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: userA } = await createUserWithToken();
      const { token: tokenB } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);

      // Create booking for user A
      const booking = await createTestBooking(userA._id, showtime._id);

      // Try to pay as user B
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ bookingId: booking._id.toString() })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Not authorized');
    });

    it('should reject if booking expired', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);

      // Create booking that expired 5 minutes ago
      const expiredExpiresAt = new Date(Date.now() - 5 * 60 * 1000);
      const booking = await createTestBooking(user._id, showtime._id, {
        expiresAt: expiredExpiresAt,
      });

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: booking._id.toString() })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('expired');
    });

    it('should return existing pending payment if one exists', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      // Create existing pending payment
      const existingOrderId = 'EXISTING-ORDER-123';
      await createTestPayment(booking._id, user._id, {
        status: 'pending',
        paypalOrderId: existingOrderId,
      });

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: booking._id.toString() })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe(existingOrderId);
    });

    it('should reject if bookingId is missing', async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject if bookingId is invalid', async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${token}`)
        .send({ bookingId: 'invalid-id' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  /* =======================
    POST /api/payments/capture
  ======================= */
  describe('POST /api/payments/capture', () => {
    it('should capture payment and confirm booking', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      const orderId = 'ORDER-TO-CAPTURE';
      await createTestPayment(booking._id, user._id, {
        status: 'pending',
        paypalOrderId: orderId,
      });

      // Mock successful capture
      mockedPaypalService.capturePayment.mockResolvedValue({
        success: true,
        captureId: 'CAPTURE-123',
        payerEmail: 'buyer@example.com',
        payerName: 'Test Buyer',
        amount: '30.00',
        paymentMethod: 'paypal',
      });

      const res = await request(app)
        .post('/api/payments/capture')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
      expect(res.body.data.booking).toBeDefined();

      // Verify payment status updated
      const payment = await Payment.findOne({ paypalOrderId: orderId });
      expect(payment?.paymentStatus).toBe('completed');
      expect(payment?.paypalCaptureId).toBe('CAPTURE-123');
      expect(payment?.payerEmail).toBe('buyer@example.com');

      // Verify booking status updated
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking?.bookingStatus).toBe('confirmed');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/payments/capture')
        .send({ orderId: 'ORDER-123' })
        .expect(401);
    });

    it('should reject if payment not found', async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .post('/api/payments/capture')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId: 'NON-EXISTENT-ORDER' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should reject if payment not pending', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      const orderId = 'COMPLETED-ORDER';
      await createTestPayment(booking._id, user._id, {
        status: 'completed',
        paypalOrderId: orderId,
        paypalCaptureId: 'ALREADY-CAPTURED',
      });

      const res = await request(app)
        .post('/api/payments/capture')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle capture failure from PayPal', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      const orderId = 'ORDER-FAIL';
      await createTestPayment(booking._id, user._id, {
        status: 'pending',
        paypalOrderId: orderId,
      });

      // Mock failed capture
      mockedPaypalService.capturePayment.mockRejectedValue(
        new Error('PayPal capture failed')
      );

      const res = await request(app)
        .post('/api/payments/capture')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId })
        .expect(400);

      expect(res.body.success).toBe(false);

      // Verify payment status updated to failed
      const payment = await Payment.findOne({ paypalOrderId: orderId });
      expect(payment?.paymentStatus).toBe('failed');

      // Verify booking remains pending
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking?.bookingStatus).toBe('pending');
    });

    it('should reject if orderId is missing', async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .post('/api/payments/capture')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  /* =======================
    POST /api/payments/cancel
  ======================= */
  describe('POST /api/payments/cancel', () => {
    it('should cancel a pending payment', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      const orderId = 'ORDER-TO-CANCEL';
      await createTestPayment(booking._id, user._id, {
        status: 'pending',
        paypalOrderId: orderId,
      });

      const res = await request(app)
        .post('/api/payments/cancel')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify payment cancelled
      const payment = await Payment.findOne({ paypalOrderId: orderId });
      expect(payment?.paymentStatus).toBe('cancelled');

      // Verify booking cancelled
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking?.bookingStatus).toBe('cancelled');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/payments/cancel')
        .send({ orderId: 'ORDER-123' })
        .expect(401);
    });
  });

  /* =======================
    POST /api/payments/:id/refund
  ======================= */
  describe('POST /api/payments/:id/refund', () => {
    it('should process refund for completed payment', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id, {
        status: 'confirmed',
      });

      const payment = await createTestPayment(booking._id, user._id, {
        status: 'completed',
        paypalOrderId: 'ORDER-REFUND',
        paypalCaptureId: 'CAPTURE-TO-REFUND',
      });

      // Mock successful refund
      mockedPaypalService.processRefund.mockResolvedValue({
        success: true,
        refundId: 'REFUND-123',
        status: 'COMPLETED',
        amount: '30.00',
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.refundId).toBe('REFUND-123');

      // Verify payment status updated
      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment?.paymentStatus).toBe('refunded');
      expect(updatedPayment?.paypalRefundId).toBe('REFUND-123');
      expect(updatedPayment?.refundDate).toBeDefined();

      // Verify booking cancelled
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking?.bookingStatus).toBe('cancelled');
    });

    it('should reject refund for non-completed payment', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);

      const payment = await createTestPayment(booking._id, user._id, {
        status: 'pending',
        paypalOrderId: 'ORDER-PENDING',
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('pending');
    });

    it('should require authentication', async () => {
      const paymentId = new mongoose.Types.ObjectId().toString();

      await request(app).post(`/api/payments/${paymentId}/refund`).expect(401);
    });

    it('should reject if payment not found', async () => {
      const { token } = await createUserWithToken();
      const fakePaymentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/payments/${fakePaymentId}/refund`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should allow admin to refund any payment', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: regularUser } = await createUserWithToken();
      const { token: adminToken } = await createUserWithToken({
        role: 'platform_admin',
      });
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(regularUser._id, showtime._id, {
        status: 'confirmed',
      });

      const payment = await createTestPayment(booking._id, regularUser._id, {
        status: 'completed',
        paypalOrderId: 'ORDER-ADMIN-REFUND',
        paypalCaptureId: 'CAPTURE-ADMIN-REFUND',
      });

      mockedPaypalService.processRefund.mockResolvedValue({
        success: true,
        refundId: 'ADMIN-REFUND-123',
        status: 'COMPLETED',
        amount: '30.00',
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  /* =======================
    GET /api/payments/my-payments
  ======================= */
  describe('GET /api/payments/my-payments', () => {
    it('should return current user payments', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();

      // Create separate showtimes to avoid unique pending booking constraint
      const { showtime: showtime1 } = await createTestShowtime(cinema._id);
      const { showtime: showtime2 } = await createTestShowtime(cinema._id);

      // Create multiple bookings and payments
      const booking1 = await createTestBooking(user._id, showtime1._id);
      const booking2 = await createTestBooking(user._id, showtime2._id);

      await createTestPayment(booking1._id, user._id, {
        status: 'completed',
        paypalOrderId: 'ORDER-1',
      });
      await createTestPayment(booking2._id, user._id, {
        status: 'pending',
        paypalOrderId: 'ORDER-2',
      });

      const res = await request(app)
        .get('/api/payments/my-payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should only return payments for current user', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: userA, token: tokenA } = await createUserWithToken();
      const { user: userB } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);

      // Create payments for both users
      const bookingA = await createTestBooking(userA._id, showtime._id);
      const bookingB = await createTestBooking(userB._id, showtime._id);

      await createTestPayment(bookingA._id, userA._id, {
        paypalOrderId: 'ORDER-A',
      });
      await createTestPayment(bookingB._id, userB._id, {
        paypalOrderId: 'ORDER-B',
      });

      const res = await request(app)
        .get('/api/payments/my-payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].userId.toString()).toBe(userA._id.toString());
    });

    it('should require authentication', async () => {
      await request(app).get('/api/payments/my-payments').expect(401);
    });

    it('should return payments sorted by date descending', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();

      // Create separate showtimes to avoid unique pending booking constraint
      const { showtime: showtime1 } = await createTestShowtime(cinema._id);
      const { showtime: showtime2 } = await createTestShowtime(cinema._id);
      const { showtime: showtime3 } = await createTestShowtime(cinema._id);

      const booking1 = await createTestBooking(user._id, showtime1._id);
      const booking2 = await createTestBooking(user._id, showtime2._id);
      const booking3 = await createTestBooking(user._id, showtime3._id);

      // Create payments with slight delay to ensure different timestamps
      await createTestPayment(booking1._id, user._id, {
        paypalOrderId: 'ORDER-OLD',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestPayment(booking2._id, user._id, {
        paypalOrderId: 'ORDER-MID',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await createTestPayment(booking3._id, user._id, {
        paypalOrderId: 'ORDER-NEW',
      });

      const res = await request(app)
        .get('/api/payments/my-payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      // Verify sorted by createdAt descending (newest first)
      const payments = res.body.data;
      expect(new Date(payments[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(payments[1].createdAt).getTime()
      );
      expect(new Date(payments[1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(payments[2].createdAt).getTime()
      );
    });
  });

  /* =======================
    GET /api/payments/:id
  ======================= */
  describe('GET /api/payments/:id', () => {
    it('should return payment by ID for owner', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user, token } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(user._id, showtime._id);
      const payment = await createTestPayment(booking._id, user._id, {
        paypalOrderId: 'ORDER-GET',
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(payment._id.toString());
    });

    it('should reject if payment belongs to different user', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: userA } = await createUserWithToken();
      const { token: tokenB } = await createUserWithToken();
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(userA._id, showtime._id);
      const payment = await createTestPayment(booking._id, userA._id, {
        paypalOrderId: 'ORDER-OTHER',
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow admin to view any payment', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: regularUser } = await createUserWithToken();
      const { token: adminToken } = await createUserWithToken({
        role: 'platform_admin',
      });
      const { showtime } = await createTestShowtime(cinema._id);
      const booking = await createTestBooking(regularUser._id, showtime._id);
      const payment = await createTestPayment(booking._id, regularUser._id, {
        paypalOrderId: 'ORDER-ADMIN-VIEW',
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  /* =======================
    GET /api/payments (Admin)
  ======================= */
  describe('GET /api/payments', () => {
    it('should return all payments for admin', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user: user1 } = await createUserWithToken();
      const { user: user2 } = await createUserWithToken();
      const { token: adminToken } = await createUserWithToken({
        role: 'platform_admin',
      });
      const { showtime } = await createTestShowtime(cinema._id);

      // Create payments for different users
      const booking1 = await createTestBooking(user1._id, showtime._id);
      const booking2 = await createTestBooking(user2._id, showtime._id);

      await createTestPayment(booking1._id, user1._id, {
        paypalOrderId: 'ORDER-USER1',
      });
      await createTestPayment(booking2._id, user2._id, {
        paypalOrderId: 'ORDER-USER2',
      });

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should reject for non-admin', async () => {
      const { token } = await createUserWithToken();

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should filter payments by status', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user } = await createUserWithToken();
      const { token: adminToken } = await createUserWithToken({
        role: 'platform_admin',
      });

      // Create separate showtimes to avoid unique pending booking constraint
      const { showtime: showtime1 } = await createTestShowtime(cinema._id);
      const { showtime: showtime2 } = await createTestShowtime(cinema._id);

      const booking1 = await createTestBooking(user._id, showtime1._id);
      const booking2 = await createTestBooking(user._id, showtime2._id);

      await createTestPayment(booking1._id, user._id, {
        status: 'completed',
        paypalOrderId: 'ORDER-COMPLETED',
      });
      await createTestPayment(booking2._id, user._id, {
        status: 'pending',
        paypalOrderId: 'ORDER-PENDING',
      });

      const res = await request(app)
        .get('/api/payments')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(1);
      expect(res.body.data.payments[0].paymentStatus).toBe('completed');
    });

    it('should support pagination', async () => {
      const cinema = await Cinema.create({ name: 'Test Cinema' });
      const { user } = await createUserWithToken();
      const { token: adminToken } = await createUserWithToken({
        role: 'platform_admin',
      });

      // Create 5 payments with separate showtimes to avoid unique constraint
      for (let i = 0; i < 5; i++) {
        const { showtime } = await createTestShowtime(cinema._id);
        const booking = await createTestBooking(user._id, showtime._id);
        await createTestPayment(booking._id, user._id, {
          paypalOrderId: `ORDER-PAGE-${i}`,
        });
      }

      const res = await request(app)
        .get('/api/payments')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(5);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/payments').expect(401);
    });
  });
});

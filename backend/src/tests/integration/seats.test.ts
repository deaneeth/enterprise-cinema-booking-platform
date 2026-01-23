// seats.test.ts (Member 6)
// Seat integration tests
// Tests seat CRUD operations, hold/release functionality, and WebSocket integration

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
} from '@jest/globals';
import SeatModel from '../../models/Seat';
import ShowtimeModel from '../../models/Showtime';
import UserModel from '../../models/User';
import MovieModel from '../../models/Movie';
import CinemaModel from '../../models/Cinema';
import { app } from '../../server';

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

let mongoServer: MongoMemoryServer;

/* =======================
  Helper Functions
======================= */

/**
 * Helper function to create a user and generate auth token
 */
const createUserWithToken = async (
  overrides?: Partial<{
    role: 'user' | 'cinema_admin' | 'platform_admin';
    email?: string;
  }>
) => {
  const user = new UserModel({
    email:
      overrides?.email ?? `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: overrides?.role ?? 'user',
    isActive: true,
  });
  await user.save();
  return { user, token: user.generateAuthToken() };
};

/**
 * Helper to create showtime with movie and cinema
 */
const createTestShowtime = async (cinemaId?: mongoose.Types.ObjectId) => {
  const movie = await MovieModel.create({
    title: `Test Movie ${Date.now()}`,
    description: 'Test Description',
    genre: ['Action'],
    language: 'English',
    duration: 120,
    releaseDate: new Date(),
    rating: 'PG-13',
    isActive: true,
  });

  const cinema = cinemaId
    ? await CinemaModel.findById(cinemaId)
    : await CinemaModel.create({
        name: 'Test Cinema',
        chain: 'Test Chain',
        location: {
          address: 'Test Address',
          city: 'Test City',
        },
        facilities: ['3D'],
        screens: 5,
        isActive: true,
      });

  const showtime = await ShowtimeModel.create({
    movieId: movie._id,
    cinemaId: cinema!._id,
    screenNumber: 1,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    price: 500,
    totalSeats: 100,
    availableSeats: 100,
    isActive: true,
  });

  return { movie, cinema: cinema!, showtime };
};

/**
 * Helper to create seats for a showtime
 */
const createTestSeats = async (
  showtimeId: mongoose.Types.ObjectId,
  count: number = 10,
  price: number = 500
) => {
  const seats = [];
  for (let i = 0; i < count; i++) {
    const row = String.fromCharCode(65 + Math.floor(i / 10)); // A, B, C...
    const column = (i % 10) + 1;
    seats.push({
      showtimeId,
      seatNumber: `${row}${column}`,
      row,
      column,
      seatType: 'regular',
      status: 'available',
      price,
    });
  }
  return await SeatModel.insertMany(seats);
};

/* =======================
  Test Setup and Teardown
======================= */

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([
    SeatModel.deleteMany({}),
    ShowtimeModel.deleteMany({}),
    UserModel.deleteMany({}),
    MovieModel.deleteMany({}),
    CinemaModel.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

/* =======================
  Seat Integration Tests
======================= */

describe('Seat Endpoints Integration Tests', () => {
  describe('POST /api/seats/generate', () => {
    it('should generate seats for a showtime (admin only)', async () => {
      const { showtime } = await createTestShowtime();
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const response = await request(app)
        .post('/api/seats/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showtimeId: showtime._id.toString(),
          totalSeats: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.seatCount).toBe(100);
    });

    it('should not generate seats if showtime does not exist', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const response = await request(app)
        .post('/api/seats/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showtimeId: new mongoose.Types.ObjectId().toString(),
          totalSeats: 100,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      const { showtime } = await createTestShowtime();
      const { token } = await createUserWithToken({ role: 'user' });

      const response = await request(app)
        .post('/api/seats/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          showtimeId: showtime._id.toString(),
          totalSeats: 100,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/seats/showtime/:showtimeId', () => {
    it('should get all seats for a showtime grouped by row', async () => {
      const { showtime } = await createTestShowtime();
      await createTestSeats(showtime._id, 20);

      const response = await request(app).get(
        `/api/seats/showtime/${showtime._id.toString()}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSeats).toBe(20);
      expect(response.body.data.rows).toBeDefined();
      expect(Array.isArray(response.body.data.allSeats)).toBe(true);
    });

    it('should return 404 if showtime does not exist', async () => {
      const response = await request(app).get(
        `/api/seats/showtime/${new mongoose.Types.ObjectId()}`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/seats/:seatId/hold', () => {
    it('should hold a seat for authenticated user', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);
      const { user, token } = await createUserWithToken();

      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('held');
      expect(response.body.data.heldBy.toString()).toBe(user._id.toString());
    });

    it('should not hold an already held seat by different user', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);
      const { token: token1 } = await createUserWithToken();
      const { token: token2 } = await createUserWithToken();

      // First user holds the seat
      await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      // Second user tries to hold the same seat
      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .set('Authorization', `Bearer ${token2}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);

      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/seats/:seatId/release', () => {
    it('should release a held seat by the user who holds it', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);
      const { token } = await createUserWithToken();

      // First hold the seat
      await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      // Then release it
      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/release`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('available');
    });

    it('should not release a seat held by another user', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);
      const { token: token1 } = await createUserWithToken();
      const { token: token2 } = await createUserWithToken();

      // First user holds the seat
      await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/hold`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      // Second user tries to release it
      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/release`)
        .set('Authorization', `Bearer ${token2}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);

      const response = await request(app)
        .put(`/api/seats/${seats[0]._id.toString()}/release`)
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/seats/book', () => {
    it('should book multiple seats', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);
      const seatIds = seats.slice(0, 3).map((s) => s._id.toString());
      const bookingId = new mongoose.Types.ObjectId().toString();
      const { token } = await createUserWithToken();

      const response = await request(app)
        .post('/api/seats/book')
        .set('Authorization', `Bearer ${token}`)
        .send({
          seatIds,
          bookingId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookedSeatsCount).toBe(3);

      // Verify seats are booked
      const bookedSeats = await SeatModel.find({ _id: { $in: seatIds } });
      bookedSeats.forEach((seat) => {
        expect(seat.status).toBe('booked');
      });
    });

    it('should require valid seat IDs', async () => {
      const { token } = await createUserWithToken();

      const response = await request(app)
        .post('/api/seats/book')
        .set('Authorization', `Bearer ${token}`)
        .send({
          seatIds: [],
          bookingId: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/seats/book')
        .send({
          seatIds: [new mongoose.Types.ObjectId().toString()],
          bookingId: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Seat Hold Expiration', () => {
    it('should release expired holds when fetching seats', async () => {
      const { showtime } = await createTestShowtime();
      const seats = await createTestSeats(showtime._id, 5);

      // Manually set a seat as held with expired time
      await SeatModel.findByIdAndUpdate(seats[0]._id, {
        status: 'held',
        heldBy: new mongoose.Types.ObjectId(),
        heldUntil: new Date(Date.now() - 1000), // 1 second in the past
      });

      // Fetch seats - should trigger expiry cleanup
      const response = await request(app).get(
        `/api/seats/showtime/${showtime._id.toString()}`
      );

      expect(response.status).toBe(200);

      // Check that the seat was released
      const releasedSeat = await SeatModel.findById(seats[0]._id);
      expect(releasedSeat?.status).toBe('available');
    });
  });
});

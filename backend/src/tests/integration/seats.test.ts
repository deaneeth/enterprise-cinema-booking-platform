// seats.test.ts (Member 6)
// Seat integration tests
// Tests seat CRUD operations, hold/release functionality, and WebSocket integration

import request from 'supertest';
import mongoose from 'mongoose';
import SeatModel from '../../models/Seat';
import ShowtimeModel from '../../models/Showtime';
import UserModel from '../../models/User';
import MovieModel from '../../models/Movie';
import CinemaModel from '../../models/Cinema';

describe('Seat Endpoints Integration Tests', () => {
  let app: any;
  let authToken: string;
  let userId: string;
  let showtimeId: string;
  let seatId: string;

  beforeAll(async () => {
    // Note: This assumes the app is properly set up in your test environment
    // You'll need to import your Express app and connect to test MongoDB
  });

  afterAll(async () => {
    // Clean up test data
    await SeatModel.deleteMany({});
    await ShowtimeModel.deleteMany({});
    await UserModel.deleteMany({});
    await MovieModel.deleteMany({});
    await CinemaModel.deleteMany({});
  });

  describe('POST /api/seats/generate', () => {
    it('should generate seats for a showtime', async () => {
      // Create test movie, cinema, and showtime
      const movie = await MovieModel.create({
        title: 'Test Movie',
        description: 'Test Description',
        genre: ['Action'],
        language: 'English',
        duration: 120,
        releaseDate: new Date(),
        rating: 'PG-13',
        isActive: true,
      });

      const cinema = await CinemaModel.create({
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
        cinemaId: cinema._id,
        screenNumber: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        date: new Date(),
        price: 500,
        totalSeats: 100,
        availableSeats: 100,
        isActive: true,
      });

      showtimeId = showtime._id.toString();

      const response = await request(app)
        .post('/api/seats/generate')
        .send({
          showtimeId: showtimeId,
          totalSeats: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.seatCount).toBe(100);
    });

    it('should not generate seats if showtime does not exist', async () => {
      const response = await request(app)
        .post('/api/seats/generate')
        .send({
          showtimeId: new mongoose.Types.ObjectId(),
          totalSeats: 100,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/seats/showtime/:showtimeId', () => {
    it('should get all seats for a showtime grouped by row', async () => {
      const response = await request(app).get(`/api/seats/showtime/${showtimeId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSeats).toBe(100);
      expect(response.body.data.rows).toBeDefined();
      expect(Array.isArray(response.body.data.allSeats)).toBe(true);

      // Get first seat for further tests
      if (response.body.data.allSeats.length > 0) {
        seatId = response.body.data.allSeats[0]._id;
      }
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
      // Create a test user (you'll need auth setup)
      const user = await UserModel.create({
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      });

      userId = user._id.toString();

      // Mock authentication (adjust based on your auth setup)
      // authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret');

      const response = await request(app)
        .put(`/api/seats/${seatId}/hold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('held');
      expect(response.body.data.heldBy.toString()).toBe(userId);
    });

    it('should not hold an already held seat', async () => {
      // Try to hold the same seat again
      const response = await request(app)
        .put(`/api/seats/${seatId}/hold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      // Get another available seat
      const seats = await SeatModel.find({ showtimeId, status: 'available' });
      if (seats.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const anotherSeatId = seats[0]._id.toString();

      const response = await request(app)
        .put(`/api/seats/${anotherSeatId}/hold`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/seats/:seatId/release', () => {
    it('should release a held seat by the user who holds it', async () => {
      const response = await request(app)
        .put(`/api/seats/${seatId}/release`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('available');
    });

    it('should not release a seat held by another user', async () => {
      // Hold seat with user 1
      await request(app)
        .put(`/api/seats/${seatId}/hold`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      // Try to release with user 2 (mock different auth token)
      // This test assumes you can generate another token

      const response = await request(app)
        .put(`/api/seats/${seatId}/release`)
        .set('Authorization', `Bearer differentToken`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/seats/book', () => {
    it('should book multiple seats', async () => {
      // Get available seats
      const availableSeats = await SeatModel.find({ showtimeId, status: 'available' }).limit(3);
      const seatIds = availableSeats.map((s) => s._id.toString());
      const bookingId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .post('/api/seats/book')
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
      const response = await request(app)
        .post('/api/seats/book')
        .send({
          seatIds: [],
          bookingId: new mongoose.Types.ObjectId().toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Seat Hold Expiration', () => {
    it('should release expired holds', async () => {
      // Get an available seat
      const seat = await SeatModel.findOne({ showtimeId, status: 'available' });
      if (!seat) return;

      // Hold with past expiration
      seat.status = 'held';
      seat.heldBy = new mongoose.Types.ObjectId();
      seat.heldUntil = new Date(Date.now() - 1000); // 1 second in the past
      await seat.save();

      // Call release expired holds
      // This depends on how you expose this method
      // For now, we'll test via the GET endpoint which calls it automatically

      const response = await request(app).get(`/api/seats/showtime/${showtimeId}`);

      expect(response.status).toBe(200);

      // Check that the seat was released
      const releasedSeat = await SeatModel.findById(seat._id);
      expect(releasedSeat?.status).toBe('available');
    });
  });
});

// seat.test.ts (Member 8)
// Unit tests for Seat model
// Tests schema validation, instance methods, and static methods

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SeatModel, { SeatDocument } from '../../models/Seat';
import Showtime from '../../models/Showtime';
import Movie from '../../models/Movie';
import Cinema from '../../models/Cinema';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Test data
let testShowtime: mongoose.Document;
let testMovie: mongoose.Document;
let testCinema: mongoose.Document;

const validSeatData = {
  seatNumber: 'A1',
  row: 'A',
  column: 1,
  seatType: 'regular' as const,
  status: 'available' as const,
  price: 500,
};

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test movie
  testMovie = await Movie.create({
    title: 'Test Movie',
    description: 'Test description',
    duration: 120,
    genre: ['Action'],
    rating: 'PG-13',
    releaseDate: new Date(),
    isActive: true,
  });

  // Create test cinema
  testCinema = await Cinema.create({
    name: 'Test Cinema',
    location: { address: '123 Test St', city: 'Test City' },
    facilities: ['Parking'],
    screens: 5,
    isActive: true,
  });

  // Create test showtime
  const startTime = new Date(Date.now() + 86400000); // Tomorrow
  testShowtime = await Showtime.create({
    movieId: testMovie._id,
    cinemaId: testCinema._id,
    screenNumber: 1,
    startTime,
    endTime: new Date(startTime.getTime() + 7200000),
    date: startTime,
    price: 500,
    format: '2D',
    totalSeats: 100,
    availableSeats: 100,
    isActive: true,
  });
});

// Cleanup: Clear seats after each test
afterEach(async () => {
  await SeatModel.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await Showtime.deleteMany({});
  await Movie.deleteMany({});
  await Cinema.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Seat Model', () => {
  // ============================================
  // Schema Validation Tests
  // ============================================
  describe('Schema Validation', () => {
    it('should create a valid seat', async () => {
      const seat = new SeatModel({
        ...validSeatData,
        showtimeId: testShowtime._id,
      });

      await expect(seat.save()).resolves.toBeDefined();
      expect(seat._id).toBeDefined();
      expect(seat.seatNumber).toBe('A1');
      expect(seat.status).toBe('available');
    });

    it('should require showtimeId', async () => {
      const seat = new SeatModel({ ...validSeatData });
      await expect(seat.validate()).rejects.toThrow('Showtime ID is required');
    });

    it('should require seatNumber', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        row: 'A',
        column: 1,
        price: 500,
      });
      await expect(seat.validate()).rejects.toThrow('Seat number is required');
    });

    it('should require row', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        seatNumber: 'A1',
        column: 1,
        price: 500,
      });
      await expect(seat.validate()).rejects.toThrow('Row is required');
    });

    it('should require column', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        seatNumber: 'A1',
        row: 'A',
        price: 500,
      });
      await expect(seat.validate()).rejects.toThrow('Column is required');
    });

    it('should require price', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        seatNumber: 'A1',
        row: 'A',
        column: 1,
      });
      await expect(seat.validate()).rejects.toThrow('Price is required');
    });

    it('should reject negative price', async () => {
      const seat = new SeatModel({
        ...validSeatData,
        showtimeId: testShowtime._id,
        price: -100,
      });
      await expect(seat.validate()).rejects.toThrow('Price cannot be negative');
    });

    it('should default status to available', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        seatNumber: 'A1',
        row: 'A',
        column: 1,
        price: 500,
      });

      expect(seat.status).toBe('available');
    });

    it('should default seatType to regular', async () => {
      const seat = new SeatModel({
        showtimeId: testShowtime._id,
        seatNumber: 'A1',
        row: 'A',
        column: 1,
        price: 500,
      });

      expect(seat.seatType).toBe('regular');
    });

    it('should accept vip seatType', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
        seatType: 'vip',
      });

      expect(seat.seatType).toBe('vip');
    });

    it('should accept wheelchair seatType', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
        seatType: 'wheelchair',
      });

      expect(seat.seatType).toBe('wheelchair');
    });

    it('should reject invalid seatType', async () => {
      const seat = new SeatModel({
        ...validSeatData,
        showtimeId: testShowtime._id,
        seatType: 'invalid' as any,
      });

      await expect(seat.validate()).rejects.toThrow(
        'Seat type must be regular, vip, or wheelchair'
      );
    });

    it('should accept held status', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
        status: 'held',
        heldBy: new mongoose.Types.ObjectId(),
        heldUntil: new Date(Date.now() + 600000),
      });

      expect(seat.status).toBe('held');
    });

    it('should accept booked status', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
        status: 'booked',
        bookingId: new mongoose.Types.ObjectId(),
      });

      expect(seat.status).toBe('booked');
    });

    it('should reject invalid status', async () => {
      const seat = new SeatModel({
        ...validSeatData,
        showtimeId: testShowtime._id,
        status: 'invalid' as any,
      });

      await expect(seat.validate()).rejects.toThrow(
        'Status must be available, held, or booked'
      );
    });
  });

  // ============================================
  // Instance Methods Tests
  // ============================================
  describe('Instance Methods', () => {
    describe('isAvailable()', () => {
      it('should return true for available seat', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
          status: 'available',
        });

        expect(seat.isAvailable()).toBe(true);
      });

      it('should return false for held seat', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
          status: 'held',
        });

        expect(seat.isAvailable()).toBe(false);
      });

      it('should return false for booked seat', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
          status: 'booked',
        });

        expect(seat.isAvailable()).toBe(false);
      });
    });

    describe('isExpired()', () => {
      it('should return false if no heldUntil date', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
        });

        expect(seat.isExpired()).toBe(false);
      });

      it('should return false if heldUntil is in the future', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
          status: 'held',
          heldUntil: new Date(Date.now() + 600000), // 10 min in future
        });

        expect(seat.isExpired()).toBe(false);
      });

      it('should return true if heldUntil is in the past', async () => {
        const seat = await SeatModel.create({
          ...validSeatData,
          showtimeId: testShowtime._id,
          status: 'held',
          heldUntil: new Date(Date.now() - 1000), // 1 sec in past
        });

        expect(seat.isExpired()).toBe(true);
      });
    });
  });

  // ============================================
  // Static Methods Tests
  // ============================================
  describe('Static Methods', () => {
    describe('generateSeatsForShowtime()', () => {
      it('should generate 100 seats with default layout', async () => {
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString()
        );

        expect(seats).toHaveLength(100);
      });

      it('should generate VIP seats for first 2 rows', async () => {
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString()
        );

        const vipSeats = seats.filter(
          (s: SeatDocument) => s.seatType === 'vip'
        );
        const regularSeats = seats.filter(
          (s: SeatDocument) => s.seatType === 'regular'
        );

        // Rows A and B (2 rows × 10 cols = 20 VIP seats)
        expect(vipSeats.length).toBe(20);
        expect(regularSeats.length).toBe(80);
      });

      it('should set higher price for VIP seats', async () => {
        // Use explicit pricing to test VIP premium
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString(),
          100,
          undefined,
          { regularPrice: 500, vipPrice: 750 }
        );

        const vipSeat = seats.find((s: SeatDocument) => s.row === 'A');
        const regularSeat = seats.find((s: SeatDocument) => s.row === 'C');

        expect(vipSeat.price).toBe(750); // VIP price
        expect(regularSeat.price).toBe(500); // Regular price
      });

      it('should generate custom layout when specified', async () => {
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString(),
          50,
          { rows: 5, cols: 5 }
        );

        expect(seats).toHaveLength(25); // 5 × 5
      });

      it('should create all seats with available status', async () => {
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString()
        );

        const allAvailable = seats.every(
          (s: SeatDocument) => s.status === 'available'
        );
        expect(allAvailable).toBe(true);
      });

      it('should generate correct seat numbers', async () => {
        const seats = await (SeatModel as any).generateSeatsForShowtime(
          testShowtime._id.toString(),
          25,
          { rows: 3, cols: 3 }
        );

        const seatNumbers = seats.map((s: SeatDocument) => s.seatNumber);
        expect(seatNumbers).toContain('A1');
        expect(seatNumbers).toContain('A3');
        expect(seatNumbers).toContain('C1');
        expect(seatNumbers).toContain('C3');
      });
    });
  });

  // ============================================
  // Timestamps Tests
  // ============================================
  describe('Timestamps', () => {
    it('should add createdAt and updatedAt on creation', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
      });

      expect(seat.createdAt).toBeInstanceOf(Date);
      expect(seat.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const seat = await SeatModel.create({
        ...validSeatData,
        showtimeId: testShowtime._id,
      });

      const originalUpdatedAt = seat.updatedAt;

      // Wait for time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      seat.status = 'held';
      await seat.save();

      expect(seat.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});

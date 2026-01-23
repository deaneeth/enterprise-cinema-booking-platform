// showtime.test.ts (Member 8)
// Unit tests for Showtime model
// Tests schema validation, instance methods, and virtuals

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Showtime, { ShowtimeDocument } from '../../models/Showtime';
import Movie from '../../models/Movie';
import Cinema from '../../models/Cinema';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Test data
let testMovie: mongoose.Document & { _id: mongoose.Types.ObjectId };
let testCinema: mongoose.Document & { _id: mongoose.Types.ObjectId };

const getValidShowtimeData = () => {
  const startTime = new Date(Date.now() + 86400000); // Tomorrow
  return {
    screenNumber: 1,
    startTime,
    endTime: new Date(startTime.getTime() + 7200000), // 2 hours later
    date: startTime,
    price: 500,
    format: '2D' as const,
    language: 'English',
    totalSeats: 100,
    availableSeats: 100,
    isActive: true,
  };
};

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test movie
  testMovie = (await Movie.create({
    title: 'Test Movie',
    description: 'Test description',
    duration: 120,
    genre: ['Action'],
    rating: 'PG-13',
    releaseDate: new Date(),
    isActive: true,
  })) as mongoose.Document & { _id: mongoose.Types.ObjectId };

  // Create test cinema
  testCinema = (await Cinema.create({
    name: 'Test Cinema',
    location: { address: '123 Test St', city: 'Test City' },
    facilities: ['Parking'],
    screens: 5,
    isActive: true,
  })) as mongoose.Document & { _id: mongoose.Types.ObjectId };
});

// Cleanup: Clear showtimes after each test
afterEach(async () => {
  await Showtime.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await Movie.deleteMany({});
  await Cinema.deleteMany({});
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Showtime Model', () => {
  // ============================================
  // Schema Validation Tests
  // ============================================
  describe('Schema Validation', () => {
    it('should create a valid showtime', async () => {
      const showtime = new Showtime({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
      });

      await expect(showtime.save()).resolves.toBeDefined();
      expect(showtime._id).toBeDefined();
      expect(showtime.screenNumber).toBe(1);
      expect(showtime.isActive).toBe(true);
    });

    it('should require movieId', async () => {
      const showtime = new Showtime({
        ...getValidShowtimeData(),
        cinemaId: testCinema._id,
      });

      await expect(showtime.validate()).rejects.toThrow();
    });

    it('should require cinemaId', async () => {
      const showtime = new Showtime({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
      });

      await expect(showtime.validate()).rejects.toThrow();
    });

    it('should require screenNumber', async () => {
      const data = getValidShowtimeData();
      const showtime = new Showtime({
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        startTime: data.startTime,
        endTime: data.endTime,
        date: data.date,
        price: data.price,
        totalSeats: data.totalSeats,
        availableSeats: data.availableSeats,
      });

      await expect(showtime.validate()).rejects.toThrow();
    });

    it('should require price', async () => {
      const data = getValidShowtimeData();
      const showtime = new Showtime({
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        screenNumber: 1,
        startTime: data.startTime,
        endTime: data.endTime,
        date: data.date,
        totalSeats: data.totalSeats,
        availableSeats: data.availableSeats,
      });

      await expect(showtime.validate()).rejects.toThrow();
    });

    it('should accept 2D format', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        format: '2D',
      });

      expect(showtime.format).toBe('2D');
    });

    it('should accept 3D format', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        format: '3D',
      });

      expect(showtime.format).toBe('3D');
    });

    it('should accept IMAX format', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        format: 'IMAX',
      });

      expect(showtime.format).toBe('IMAX');
    });

    it('should default isActive to true', async () => {
      const data = getValidShowtimeData();
      const showtime = new Showtime({
        ...data,
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        isActive: undefined,
      });

      expect(showtime.isActive).toBe(true);
    });
  });

  // ============================================
  // Virtual Property Tests
  // ============================================
  describe('Virtual Properties', () => {
    describe('hasBookings', () => {
      it('should return false when all seats are available', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          totalSeats: 100,
          availableSeats: 100,
        });

        expect(showtime.hasBookings).toBe(false);
      });

      it('should return true when some seats are booked', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          totalSeats: 100,
          availableSeats: 90,
        });

        expect(showtime.hasBookings).toBe(true);
      });

      it('should return true when all seats are booked', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          totalSeats: 100,
          availableSeats: 0,
        });

        expect(showtime.hasBookings).toBe(true);
      });
    });
  });

  // ============================================
  // Instance Methods Tests
  // ============================================
  describe('Instance Methods', () => {
    describe('isBookable()', () => {
      it('should return true for active future showtime with available seats', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          isActive: true,
          availableSeats: 50,
        });

        expect(showtime.isBookable()).toBe(true);
      });

      it('should return false for inactive showtime', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          isActive: false,
          availableSeats: 50,
        });

        expect(showtime.isBookable()).toBe(false);
      });

      it('should return false for past showtime', async () => {
        const pastTime = new Date(Date.now() - 86400000); // Yesterday
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          startTime: pastTime,
          endTime: new Date(pastTime.getTime() + 7200000),
          date: pastTime,
          isActive: true,
          availableSeats: 50,
        });

        expect(showtime.isBookable()).toBe(false);
      });

      it('should return false for sold out showtime', async () => {
        const showtime = await Showtime.create({
          ...getValidShowtimeData(),
          movieId: testMovie._id,
          cinemaId: testCinema._id,
          isActive: true,
          availableSeats: 0,
        });

        expect(showtime.isBookable()).toBe(false);
      });
    });
  });

  // ============================================
  // Timestamps Tests
  // ============================================
  describe('Timestamps', () => {
    it('should add createdAt and updatedAt on creation', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
      });

      expect(showtime.get('createdAt')).toBeInstanceOf(Date);
      expect(showtime.get('updatedAt')).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
      });

      const originalUpdatedAt = showtime.get('updatedAt') as Date;

      // Wait for time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      showtime.availableSeats = 90;
      await showtime.save();

      expect((showtime.get('updatedAt') as Date).getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  // ============================================
  // Seat Count Tests
  // ============================================
  describe('Seat Count Operations', () => {
    it('should track totalSeats correctly', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        totalSeats: 150,
        availableSeats: 150,
      });

      expect(showtime.totalSeats).toBe(150);
    });

    it('should allow availableSeats to be updated', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        totalSeats: 100,
        availableSeats: 100,
      });

      showtime.availableSeats = 95;
      await showtime.save();

      const updated = await Showtime.findById(showtime._id);
      expect(updated?.availableSeats).toBe(95);
    });

    it('should calculate correct booking count from seat difference', async () => {
      const showtime = await Showtime.create({
        ...getValidShowtimeData(),
        movieId: testMovie._id,
        cinemaId: testCinema._id,
        totalSeats: 100,
        availableSeats: 75,
      });

      const bookedSeats = showtime.totalSeats - showtime.availableSeats;
      expect(bookedSeats).toBe(25);
    });
  });
});

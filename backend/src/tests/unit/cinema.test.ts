// cinema.test.ts (Member 2)
// Unit tests for Cinema model
// Tests schema validation, default values, and calculateDistance method

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Cinema from '../../models/Cinema';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Clear database after each test
afterEach(async () => {
  await Cinema.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Cinema Model', () => {
  // ============================================
  // FIELD VALIDATION TESTS
  // ============================================
  describe('Field Validation', () => {
    it('should require name', async () => {
      const cinema = new Cinema({});
      await expect(cinema.validate()).rejects.toThrow(
        'Cinema name is required'
      );
    });

    it('should default isActive to true', async () => {
      const cinema = new Cinema({ name: 'Test Cinema' });
      await cinema.save();
      expect(cinema.isActive).toBe(true);
    });
  });

  // ============================================
  // CALCULATE DISTANCE TESTS
  // ============================================
  describe('calculateDistance Method', () => {
    it('should return 0 km for the same coordinates', async () => {
      const cinema = new Cinema({
        name: 'Distance Test Cinema',
        location: { coordinates: { lat: 0, lng: 0 } },
      });
      await cinema.save();

      const distance = cinema.calculateDistance(0, 0);
      expect(distance).toBeCloseTo(0, 6);
    });

    it('should return the correct approximate distance in km', async () => {
      // From (0,0) to (0,1) is ~111.195 km at the equator
      const cinema = new Cinema({
        name: 'Equator Cinema',
        location: { coordinates: { lat: 0, lng: 0 } },
      });
      await cinema.save();

      const distance = cinema.calculateDistance(0, 1);
      expect(distance).toBeCloseTo(111.195, 1);
    });

    it('should throw if cinema coordinates are not set', async () => {
      const cinema = new Cinema({ name: 'No Coords Cinema' });
      await cinema.save();

      expect(() => cinema.calculateDistance(1, 1)).toThrow(
        'Cinema coordinates are not set'
      );
    });

    it('should throw for invalid input coordinates', async () => {
      const cinema = new Cinema({
        name: 'Invalid Input Cinema',
        location: { coordinates: { lat: 0, lng: 0 } },
      });
      await cinema.save();

      expect(() => cinema.calculateDistance(Number.NaN, 10)).toThrow(
        'Invalid coordinates provided'
      );
    });
  });
});

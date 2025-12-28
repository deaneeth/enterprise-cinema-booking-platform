// cinemas.test.ts (Member 2)
// Integration tests for Cinema API endpoints
// Tests CRUD, filters, search, permissions, and soft delete behavior

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../server';
import User from '../../models/User';
import Cinema from '../../models/Cinema';

let mongoServer: MongoMemoryServer;

// Helper: Create a user directly in DB and generate a JWT for authenticated requests
const createUserWithToken = async (
  overrides?: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'user' | 'cinema_admin' | 'platform_admin';
    cinemaId: mongoose.Types.ObjectId;
  }>
) => {
  const user = new User({
    email: overrides?.email ?? `test-${Date.now()}@example.com`,
    password: overrides?.password ?? 'password123',
    firstName: overrides?.firstName ?? 'Test',
    lastName: overrides?.lastName ?? 'User',
    phone: overrides?.phone ?? '+1234567890',
    role: overrides?.role ?? 'user',
    cinemaId: overrides?.cinemaId,
    isActive: true,
  });

  await user.save();
  const token = user.generateAuthToken();
  return { user, token };
};

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';

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
  await Promise.all([User.deleteMany({}), Cinema.deleteMany({})]);
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Cinema Endpoints', () => {
  // ============================================
  // POST /api/cinemas
  // ============================================
  describe('POST /api/cinemas', () => {
    it('should create a cinema when authenticated as platform_admin', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const payload = {
        name: 'PVR Cinemas - Colombo',
        chain: 'PVR',
        location: {
          address: '123 Main St',
          city: 'Colombo',
          coordinates: { lat: 6.9271, lng: 79.8612 },
        },
        facilities: ['3D', 'IMAX'],
        screens: 10,
      };

      const res = await request(app)
        .post('/api/cinemas')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cinema');
      expect(res.body.data.cinema.name).toBe(payload.name);
      expect(res.body.data.cinema.location.city).toBe('Colombo');
    });

    it('should reject creation for non-platform users', async () => {
      const { token } = await createUserWithToken({ role: 'user' });

      await request(app)
        .post('/api/cinemas')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Should Fail' })
        .expect(403);
    });
  });

  // ============================================
  // GET /api/cinemas
  // ============================================
  describe('GET /api/cinemas', () => {
    it('should list active cinemas and support city filter', async () => {
      await Cinema.create([
        {
          name: 'Cinema A',
          location: { city: 'Colombo' },
          facilities: ['IMAX', '3D'],
          isActive: true,
        },
        {
          name: 'Cinema B',
          location: { city: 'Kandy' },
          facilities: ['3D'],
          isActive: true,
        },
      ]);

      const allRes = await request(app).get('/api/cinemas').expect(200);
      expect(allRes.body.success).toBe(true);
      expect(allRes.body.data.cinemas).toHaveLength(2);

      const filteredRes = await request(app)
        .get('/api/cinemas')
        .query({ city: 'Colombo' })
        .expect(200);

      expect(filteredRes.body.success).toBe(true);
      expect(filteredRes.body.data.cinemas).toHaveLength(1);
      expect(filteredRes.body.data.cinemas[0].name).toBe('Cinema A');
    });

    it('should support facilities filter (requires all)', async () => {
      await Cinema.create([
        {
          name: 'Cinema A',
          location: { city: 'Colombo' },
          facilities: ['IMAX', '3D'],
          isActive: true,
        },
        {
          name: 'Cinema B',
          location: { city: 'Colombo' },
          facilities: ['3D'],
          isActive: true,
        },
      ]);

      const res = await request(app)
        .get('/api/cinemas')
        .query({ facilities: 'IMAX,3D' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.cinemas).toHaveLength(1);
      expect(res.body.data.cinemas[0].name).toBe('Cinema A');
    });
  });

  // ============================================
  // GET /api/cinemas/:id
  // ============================================
  describe('GET /api/cinemas/:id', () => {
    it('should return a cinema by id', async () => {
      const cinema = await Cinema.create({
        name: 'Cinema Detail',
        location: { city: 'Colombo' },
        isActive: true,
      });

      const res = await request(app)
        .get(`/api/cinemas/${cinema._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.cinema.name).toBe('Cinema Detail');
    });

    it('should return 404 for inactive cinema', async () => {
      const cinema = await Cinema.create({
        name: 'Inactive Cinema',
        isActive: false,
      });

      await request(app).get(`/api/cinemas/${cinema._id}`).expect(404);
    });
  });

  // ============================================
  // GET /api/cinemas/search?q=...
  // ============================================
  describe('GET /api/cinemas/search?q=...', () => {
    it('should search by name or city', async () => {
      await Cinema.create([
        { name: 'PVR Cinemas - Colombo', location: { city: 'Colombo' } },
        { name: 'Scope Cinemas - Kandy', location: { city: 'Kandy' } },
      ]);

      const resByName = await request(app)
        .get('/api/cinemas/search')
        .query({ q: 'PVR' })
        .expect(200);

      expect(resByName.body.success).toBe(true);
      expect(resByName.body.data.cinemas).toHaveLength(1);

      const resByCity = await request(app)
        .get('/api/cinemas/search')
        .query({ q: 'kandy' })
        .expect(200);

      expect(resByCity.body.success).toBe(true);
      expect(resByCity.body.data.cinemas).toHaveLength(1);
      expect(resByCity.body.data.cinemas[0].name).toContain('Kandy');
    });

    it('should return 400 when q is missing', async () => {
      await request(app).get('/api/cinemas/search').expect(400);
    });
  });

  // ============================================
  // PUT /api/cinemas/:id
  // ============================================
  describe('PUT /api/cinemas/:id', () => {
    it('should allow cinema_admin to update their own cinema', async () => {
      const cinema = await Cinema.create({
        name: 'Owned Cinema',
        isActive: true,
      });
      const { token } = await createUserWithToken({
        role: 'cinema_admin',
        cinemaId: cinema._id,
      });

      const res = await request(app)
        .put(`/api/cinemas/${cinema._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Owned Cinema Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.cinema.name).toBe('Owned Cinema Updated');
    });

    it('should forbid cinema_admin from updating a different cinema', async () => {
      const cinemaA = await Cinema.create({ name: 'Cinema A', isActive: true });
      const cinemaB = await Cinema.create({ name: 'Cinema B', isActive: true });

      const { token } = await createUserWithToken({
        role: 'cinema_admin',
        cinemaId: cinemaA._id,
      });

      await request(app)
        .put(`/api/cinemas/${cinemaB._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Should Not Work' })
        .expect(403);
    });

    it('should allow platform_admin to update any cinema', async () => {
      const cinema = await Cinema.create({ name: 'Cinema X', isActive: true });
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const res = await request(app)
        .put(`/api/cinemas/${cinema._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cinema X Updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.cinema.name).toBe('Cinema X Updated');
    });
  });

  // ============================================
  // DELETE /api/cinemas/:id
  // ============================================
  describe('DELETE /api/cinemas/:id', () => {
    it('should soft delete a cinema (isActive=false) and hide it from list', async () => {
      const cinema = await Cinema.create({
        name: 'Cinema To Delete',
        location: { city: 'Colombo' },
        isActive: true,
      });

      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const delRes = await request(app)
        .delete(`/api/cinemas/${cinema._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(delRes.body.success).toBe(true);
      expect(delRes.body.data.cinema.isActive).toBe(false);

      const listRes = await request(app).get('/api/cinemas').expect(200);
      expect(listRes.body.data.cinemas).toHaveLength(0);

      await request(app).get(`/api/cinemas/${cinema._id}`).expect(404);

      const inDb = await Cinema.findById(cinema._id);
      expect(inDb).toBeTruthy();
      expect(inDb?.isActive).toBe(false);
    });
  });
});

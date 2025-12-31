// movies.test.ts
// Integration tests for Movie API endpoints
// Tests CRUD, pagination, filters, search, permissions, and soft delete behavior

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../server';
import User from '../../models/User';
import Movie from '../../models/Movie';

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
  }>
) => {
  const user = new User({
    email: overrides?.email ?? `test-${Date.now()}@example.com`,
    password: overrides?.password ?? 'password123',
    firstName: overrides?.firstName ?? 'Test',
    lastName: overrides?.lastName ?? 'User',
    phone: overrides?.phone ?? '+1234567890',
    role: overrides?.role ?? 'user',
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

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Clear database after each test
afterEach(async () => {
  await Promise.all([User.deleteMany({}), Movie.deleteMany({})]);
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Movie Endpoints', () => {
  // ============================================
  // POST /api/movies
  // ============================================
  describe('POST /api/movies', () => {
    it('should create a movie when authenticated as platform_admin', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const payload = {
        title: 'Inception',
        description: 'A mind-bending thriller',
        genre: 'Action',
        duration: 148,
        rating: 'PG-13',
        director: 'Christopher Nolan',
        cast: ['Leonardo DiCaprio'],
        posterUrl: 'http://example.com/inception.jpg',
        releaseDate: '2010-07-16',
      };

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('movie');
      expect(res.body.data.movie.title).toBe(payload.title);
      expect(res.body.data.movie.director).toBe(payload.director);
    });

    it('should reject creation for non-platform users', async () => {
      const { token } = await createUserWithToken({ role: 'user' });

      await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Should Fail' })
        .expect(403);
    });

    it('should reject creation when title is missing', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject creation with invalid rating value', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad Rating', rating: 'INVALID' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject creation with negative duration', async () => {
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const res = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad Duration', duration: -90 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // GET /api/movies
  // ============================================
  describe('GET /api/movies', () => {
    it('should list active movies and support genre filter', async () => {
      await Movie.create([
        { title: 'Movie A', genre: 'Action', isActive: true },
        { title: 'Movie B', genre: 'Drama', isActive: true },
      ]);

      const allRes = await request(app).get('/api/movies').expect(200);
      expect(allRes.body.success).toBe(true);
      expect(allRes.body.data.movies.length).toBeGreaterThanOrEqual(2);

      const filteredRes = await request(app)
        .get('/api/movies')
        .query({ genre: 'Action' })
        .expect(200);

      expect(filteredRes.body.success).toBe(true);
      expect(filteredRes.body.data.movies).toHaveLength(1);
      expect(filteredRes.body.data.movies[0].title).toBe('Movie A');
    });

    it('should support pagination', async () => {
      // create 12 movies
      const docs = Array.from({ length: 12 }).map((_, i) => ({
        title: `Paged Movie ${i + 1}`,
        genre: i % 2 === 0 ? 'Action' : 'Comedy',
        isActive: true,
      }));
      await Movie.create(docs);

      const res = await request(app)
        .get('/api/movies')
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.movies).toHaveLength(5);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(2);
    });
  });

  // ============================================
  // GET /api/movies/:id
  // ============================================
  describe('GET /api/movies/:id', () => {
    it('should return a movie by id', async () => {
      const movie = await Movie.create({
        title: 'Detail Movie',
        director: 'Someone',
        isActive: true,
      });

      const res = await request(app)
        .get(`/api/movies/${movie._id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.movie.title).toBe('Detail Movie');
    });

    it('should return 404 for inactive movie', async () => {
      const movie = await Movie.create({ title: 'Inactive', isActive: false });

      await request(app).get(`/api/movies/${movie._id}`).expect(404);
    });
  });

  // ============================================
  // GET /api/movies/search?q=...
  // ============================================
  describe('GET /api/movies/search?q=...', () => {
    it('should search by title', async () => {
      await Movie.create([
        { title: 'Interstellar', director: 'Christopher', isActive: true },
        { title: 'Dunkirk', director: 'Nolan', isActive: true },
      ]);

      const resByTitle = await request(app)
        .get('/api/movies/search')
        .query({ q: 'Interstellar' })
        .expect(200);

      expect(resByTitle.body.success).toBe(true);
      expect(resByTitle.body.data.movies.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 400 when q is missing', async () => {
      await request(app).get('/api/movies/search').expect(400);
    });
  });

  // ============================================
  // PUT /api/movies/:id
  // ============================================
  describe('PUT /api/movies/:id', () => {
    it('should allow platform_admin to update any movie', async () => {
      const movie = await Movie.create({ title: 'To Update', isActive: true });
      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const res = await request(app)
        .put(`/api/movies/${movie._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.movie.title).toBe('Updated Title');
    });

    it('should forbid non-admin users from updating', async () => {
      const movie = await Movie.create({ title: 'Nope', isActive: true });
      const { token } = await createUserWithToken({ role: 'user' });

      await request(app)
        .put(`/api/movies/${movie._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad Update' })
        .expect(403);
    });
  });

  // ============================================
  // DELETE /api/movies/:id
  // ============================================
  describe('DELETE /api/movies/:id', () => {
    it('should soft delete a movie (isActive=false) and hide it from list', async () => {
      const movie = await Movie.create({ title: 'Delete Me', isActive: true });

      const { token } = await createUserWithToken({ role: 'platform_admin' });

      const delRes = await request(app)
        .delete(`/api/movies/${movie._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(delRes.body.success).toBe(true);
      expect(delRes.body.data.movie.isActive).toBe(false);

      const listRes = await request(app).get('/api/movies').expect(200);
      // ensure deleted movie is not present in active listing
      const found = listRes.body.data.movies.find(
        (m: any) => m._id === String(movie._id)
      );
      expect(found).toBeUndefined();

      await request(app).get(`/api/movies/${movie._id}`).expect(404);

      const inDb = await Movie.findById(movie._id);
      expect(inDb).toBeTruthy();
      expect(inDb?.isActive).toBe(false);
    });
  });
});

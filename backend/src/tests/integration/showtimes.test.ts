import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { beforeAll, afterEach, afterAll, describe, it, expect } from '@jest/globals';
import { app } from '../../server';
import User from '../../models/User';
import Movie from '../../models/Movie';
import Cinema from '../../models/Cinema';
import Showtime from '../../models/Showtime';

let mongoServer: MongoMemoryServer;

const createUserWithToken = async (overrides?: Partial<{ role: 'user' | 'cinema_admin' | 'platform_admin'; cinemaId?: mongoose.Types.ObjectId }>) => {
  const user = new User({
    email: `test-${Date.now()}@example.com`,
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

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Movie.deleteMany({}), Cinema.deleteMany({}), Showtime.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Showtime Integration', () => {
  it('calculates endTime from movie.duration on create', async () => {
    const movie = await Movie.create({ title: 'Test Movie', duration: 125, isActive: true });
    const cinema = await Cinema.create({ name: 'Test Cinema' });
    const { token } = await createUserWithToken({ role: 'cinema_admin', cinemaId: cinema._id });
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const res = await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 1, startTime: startTime.toISOString(), price: 1200, format: '2D', totalSeats: 100 })
      .expect(201);

    const expectedEnd = new Date(startTime.getTime() + (movie.duration as number) * 60000).getTime();
    expect(new Date(res.body.endTime).getTime()).toBe(expectedEnd);
  });

  it('filters showtimes by date query', async () => {
    const movie = await Movie.create({ title: 'Filter Movie', duration: 90, isActive: true });
    const cinema = await Cinema.create({ name: 'Filter Cinema' });
    const { token } = await createUserWithToken({ role: 'cinema_admin', cinemaId: cinema._id });

    await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 1, startTime: new Date(2026, 0, 15, 19, 30, 0).toISOString(), price: 1000, format: '2D', totalSeats: 50 })
      .expect(201);

    await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 2, startTime: new Date(2026, 0, 16, 19, 30, 0).toISOString(), price: 1000, format: '2D', totalSeats: 50 })
      .expect(201);

    const res = await request(app).get('/api/showtimes').query({ date: '2026-01-15' }).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('isBookable() respects time and availability', async () => {
    const movie = await Movie.create({ title: 'Bookable', duration: 60, isActive: true });
    const cinema = await Cinema.create({ name: 'Bookable Cinema' });
    const { token } = await createUserWithToken({ role: 'cinema_admin', cinemaId: cinema._id });

    // Use dates far in the future/past to avoid edge cases
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    const resF = await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 1, startTime: future.toISOString(), price: 900, format: '2D', totalSeats: 20 })
      .expect(201);

    const resP = await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 2, startTime: past.toISOString(), price: 900, format: '2D', totalSeats: 20 })
      .expect(201);

    // Verify response objects have correct structure
    expect(resF.body.availableSeats).toBe(20);
    expect(resF.body.startTime).toBeDefined();
    expect(resF.body.isActive).toBe(true);

    // Fetch from database and test isBookable()
    const sFuture = await Showtime.findById(resF.body._id);
    const sPast = await Showtime.findById(resP.body._id);
    
    expect(sFuture).toBeTruthy();
    expect(sPast).toBeTruthy();
    expect(sFuture?.availableSeats).toBe(20);
    expect(sPast?.availableSeats).toBe(20);
    
    // Future showtime: startTime is in future, active, has seats -> bookable
    expect(sFuture?.isBookable()).toBe(true);
    // Past showtime: startTime is in past -> not bookable
    expect(sPast?.isBookable()).toBe(false);

    // When seats are full, even future active showtimes are not bookable
    sFuture!.availableSeats = 0;
    await sFuture!.save();
    const reloaded = await Showtime.findById(sFuture!._id);
    expect(reloaded?.isBookable()).toBe(false);
  });

  it('blocks update/delete when bookings exist (simulated)', async () => {
    const movie = await Movie.create({ title: 'Guard', duration: 100, isActive: true });
    const cinema = await Cinema.create({ name: 'Guard Cinema' });
    const { token } = await createUserWithToken({ role: 'cinema_admin', cinemaId: cinema._id });

    const res = await request(app)
      .post('/api/showtimes')
      .set('Authorization', `Bearer ${token}`)
      .send({ movieId: String(movie._id), cinemaId: String(cinema._id), screenNumber: 1, startTime: new Date(Date.now() + 24*60*60*1000).toISOString(), price: 1100, format: '2D', totalSeats: 10 })
      .expect(201);

    const st = await Showtime.findById(res.body._id);
    st!.availableSeats = 8;
    await st!.save();

    await request(app).put(`/api/showtimes/${st!._id}`).set('Authorization', `Bearer ${token}`).send({ price: 1300 }).expect(409);
    await request(app).delete(`/api/showtimes/${st!._id}`).set('Authorization', `Bearer ${token}`).expect(409);
  });
});

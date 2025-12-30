import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Movie from '../../models/Movie';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await Movie.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Movie Model', () => {
  describe('formatDuration()', () => {
    it('formats hours and minutes correctly', async () => {
      const m = new Movie({ title: 'Long Movie', duration: 150 });
      expect(m.formatDuration()).toBe('2h 30m');
    });

    it('formats minutes only correctly', async () => {
      const m = new Movie({ title: 'Short Movie', duration: 45 });
      expect(m.formatDuration()).toBe('45m');
    });

    it('returns 0m for non-finite or negative durations', async () => {
      const a = new Movie({ title: 'Negative', duration: -5 });
      expect(a.formatDuration()).toBe('0m');

      const b = new Movie({ title: 'NaN', duration: Number.NaN as any });
      expect(b.formatDuration()).toBe('0m');
    });
  });

  describe('Validation', () => {
    it('requires title', async () => {
      const m: any = new Movie({});
      await expect(m.validate()).rejects.toThrow(/Title is required/);
    });

    it('defaults isActive to true', async () => {
      const m = new Movie({ title: 'Active Movie' });
      await m.save();
      expect(m.isActive).toBe(true);
    });

    it('rejects invalid genre values', async () => {
      const m: any = new Movie({ title: 'Genre Test', genre: ['Sci-Fi'] });
      await expect(m.validate()).rejects.toThrow();
    });

    it('rejects negative duration', async () => {
      const m: any = new Movie({ title: 'Bad Duration', duration: -10 });
      await expect(m.validate()).rejects.toThrow(/Duration must be >= 0/);
    });

    it('rejects invalid rating', async () => {
      const m: any = new Movie({ title: 'Bad Rating', rating: 'X' });
      await expect(m.validate()).rejects.toThrow();
    });
  });
});

// server.test.ts (Member 8 - Testing Lead)
// Unit tests for Server setup and configuration
// Tests middleware, routes registration, and health check

import request from 'supertest';
import { app } from '../../server';

describe('Server', () => {
  // ============================================
  // Health Check Tests
  // ============================================
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
    });

    it('should return timestamp in ISO format', async () => {
      const response = await request(app).get('/health').expect(200);

      const timestamp = response.body.data.timestamp;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  // ============================================
  // CORS Tests
  // ============================================
  describe('CORS', () => {
    it('should allow OPTIONS requests', async () => {
      await request(app).options('/api/movies').expect(204);
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/movies')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  // ============================================
  // API Routes Existence Tests
  // ============================================
  describe('API Routes', () => {
    describe('User Routes', () => {
      it('should have /api/auth/login route', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com', password: 'test' });

        // Will fail validation but route exists
        expect(response.status).not.toBe(404);
      });

      it('should have /api/auth/register route', async () => {
        const response = await request(app).post('/api/auth/register').send({});

        expect(response.status).not.toBe(404);
      });
    });

    describe('Movie Routes', () => {
      it('should have /api/movies route', async () => {
        const response = await request(app).get('/api/movies');

        expect(response.status).not.toBe(404);
      });
    });

    describe('Cinema Routes', () => {
      it('should have /api/cinemas route', async () => {
        const response = await request(app).get('/api/cinemas');

        expect(response.status).not.toBe(404);
      });
    });

    describe('Review Routes', () => {
      it('should have /api/reviews route', async () => {
        const response = await request(app).get('/api/reviews');

        expect(response.status).not.toBe(404);
      });
    });

    describe('Showtime Routes', () => {
      it('should have /api/showtimes route', async () => {
        const response = await request(app).get('/api/showtimes');

        expect(response.status).not.toBe(404);
      });
    });

    describe('Booking Routes', () => {
      it('should have /api/bookings route (requires auth)', async () => {
        const response = await request(app).get('/api/bookings');

        // Will fail auth but route exists
        expect(response.status).toBe(401);
      });
    });

    describe('Payment Routes', () => {
      it('should have /api/payments route (requires auth)', async () => {
        const response = await request(app).get('/api/payments');

        // Will fail auth but route exists
        expect(response.status).toBe(401);
      });
    });
  });

  // ============================================
  // Not Found Handler Tests
  // ============================================
  describe('Not Found Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route-that-does-not-exist')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });

  // ============================================
  // Content Type Tests
  // ============================================
  describe('Content Type', () => {
    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'test@test.com', password: 'test' });

      expect(response.type).toBe('application/json');
    });

    it('should return JSON responses', async () => {
      const response = await request(app).get('/health');

      expect(response.type).toBe('application/json');
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Should get a 400 error for malformed JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

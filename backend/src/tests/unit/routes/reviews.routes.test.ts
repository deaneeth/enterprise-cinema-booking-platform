// routes.test.ts (Member 8 - Testing Lead)
// Unit tests for Review Routes
// Tests route definitions and middleware application

import express, { Express } from 'express';
import reviewRoutes from '../../../routes/reviews';

describe('Review Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', reviewRoutes);
  });

  describe('Route Registration', () => {
    it('should have GET /api/reviews route', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(
        routes.some((r) => r.path === '/reviews' && r.method === 'get')
      ).toBe(true);
    });

    it('should have GET /api/reviews/:id route', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(
        routes.some((r) => r.path === '/reviews/:id' && r.method === 'get')
      ).toBe(true);
    });

    it('should have POST /api/reviews route', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(
        routes.some((r) => r.path === '/reviews' && r.method === 'post')
      ).toBe(true);
    });

    it('should have PUT /api/reviews/:id route', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(
        routes.some((r) => r.path === '/reviews/:id' && r.method === 'put')
      ).toBe(true);
    });

    it('should have DELETE /api/reviews/:id route', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(
        routes.some((r) => r.path === '/reviews/:id' && r.method === 'delete')
      ).toBe(true);
    });
  });

  describe('Route Count', () => {
    it('should have 5 routes registered', () => {
      const routes = getRegisteredRoutes(reviewRoutes);
      expect(routes.length).toBe(5);
    });
  });
});

// Helper function to extract registered routes from a router
function getRegisteredRoutes(
  router: express.Router
): Array<{ path: string; method: string }> {
  const routes: Array<{ path: string; method: string }> = [];

  // Access the router stack to get registered routes
  const stack = (router as any).stack || [];

  for (const layer of stack) {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods);

      for (const method of methods) {
        routes.push({ path, method });
      }
    }
  }

  return routes;
}

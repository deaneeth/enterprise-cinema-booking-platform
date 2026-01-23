// users.test.ts (Member 8)
// Integration tests for user management endpoints
// Tests profile updates, password changes, and admin-only endpoints

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { app } from '../../server';
import User from '../../models/User';

let mongoServer: MongoMemoryReplSet;
let authToken: string;
let userId: string;
let adminToken: string;
let adminId: string;

const testUser = {
  email: 'user@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
};

const adminUser = {
  email: 'admin@example.com',
  password: 'adminpass123',
  firstName: 'Admin',
  lastName: 'User',
  phone: '+0987654321',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';

  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(mongoServer.getUri());
}, 60000);

beforeEach(async () => {
  await User.deleteMany({});

  // Create regular user
  const userResponse = await request(app)
    .post('/api/auth/register')
    .send(testUser);
  authToken = userResponse.body.data.token;
  userId = userResponse.body.data.user.id;

  // Create admin user directly in DB
  const admin = await User.create({
    ...adminUser,
    role: 'platform_admin',
  });
  adminToken = admin.generateAuthToken();
  adminId = admin._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Endpoints', () => {
  // ============================================
  // GET /api/users/:id
  // ============================================
  describe('GET /api/users/:id', () => {
    it('should get user by id when authenticated', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      await request(app).get(`/api/users/${userId}`).expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // PUT /api/users/:id
  // ============================================
  describe('PUT /api/users/:id', () => {
    it('should update own profile successfully', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
    });

    it('should update phone number', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: '+9999999999' })
        .expect(200);

      expect(response.body.data.user.phone).toBe('+9999999999');
    });

    it('should return 403 when updating another user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to update any user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'AdminUpdated' })
        .expect(200);

      expect(response.body.data.user.firstName).toBe('AdminUpdated');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/users/${userId}`)
        .send({ firstName: 'Updated' })
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // PUT /api/users/:id/change-password
  // ============================================
  describe('PUT /api/users/:id/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/change-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'newpassword123' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return 400 when current password is incorrect', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/change-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when new password is too short', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/change-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: '12345',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}/change-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: testUser.password })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 when changing another users password', async () => {
      const response = await request(app)
        .put(`/api/users/${adminId}/change-password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // DELETE /api/users/:id
  // ============================================
  describe('DELETE /api/users/:id', () => {
    it('should deactivate own account', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is deactivated (can't login)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(401);

      expect(loginResponse.body.error.message).toContain('deactivated');
    });

    it('should allow admin to deactivate any user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 when deactivating another user as non-admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // GET /api/users (Admin only)
  // ============================================
  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination).toBeDefined();
    });
  });

  // ============================================
  // POST /api/auth/logout
  // ============================================
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app).post('/api/auth/logout').expect(401);
    });
  });

  // ============================================
  // POST /api/auth/forgot-password
  // ============================================
  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // POST /api/auth/reset-password
  // ============================================
  describe('POST /api/auth/reset-password', () => {
    it('should return 400 for invalid reset token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'newpassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

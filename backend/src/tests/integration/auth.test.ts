// auth.test.ts (Member 1)
// Integration tests for authentication endpoints
// Tests register, login, and getMe endpoints using Supertest

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../server';
import User from '../../models/User';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

// Test user data
const validUserData = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
};

// Registered user token for authenticated tests
let authToken: string;

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  // Set test environment
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRE = '1h';

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Clear database after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Teardown: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Endpoints', () => {
  // ============================================
  // POST /api/auth/register
  // ============================================
  describe('POST /api/auth/register', () => {
    describe('Success Cases', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(validUserData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(validUserData.email);
        expect(response.body.data.user.firstName).toBe(validUserData.firstName);
        expect(response.body.data.user.lastName).toBe(validUserData.lastName);
        expect(response.body.data.user).not.toHaveProperty('password');
      });

      it('should register user with optional phone field omitted', async () => {
        const { phone, ...userWithoutPhone } = validUserData;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userWithoutPhone)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.phone).toBeUndefined();
      });

      it('should return JWT token on successful registration', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(validUserData)
          .expect(201);

        expect(response.body.data.token).toBeDefined();
        expect(typeof response.body.data.token).toBe('string');
        expect(response.body.data.token.split('.')).toHaveLength(3);
      });
    });

    describe('Validation Error Cases', () => {
      it('should return 400 when email is missing', async () => {
        const { email, ...userWithoutEmail } = validUserData;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userWithoutEmail)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('message');
      });

      it('should return 400 when password is missing', async () => {
        const { password, ...userWithoutPassword } = validUserData;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userWithoutPassword)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when password is too short', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ ...validUserData, password: '12345' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({ ...validUserData, email: 'invalid-email' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email already exists', async () => {
        // Register first user
        await request(app).post('/api/auth/register').send(validUserData);

        // Try to register with same email
        const response = await request(app)
          .post('/api/auth/register')
          .send(validUserData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when firstName is missing', async () => {
        const { firstName, ...userWithoutFirstName } = validUserData;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userWithoutFirstName)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when lastName is missing', async () => {
        const { lastName, ...userWithoutLastName } = validUserData;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userWithoutLastName)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // POST /api/auth/login
  // ============================================
  describe('POST /api/auth/login', () => {
    // Register a user before login tests
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUserData);
    });

    describe('Success Cases', () => {
      it('should login successfully with correct credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
            password: validUserData.password,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(validUserData.email);
      });

      it('should return JWT token on successful login', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
            password: validUserData.password,
          })
          .expect(200);

        expect(response.body.data.token).toBeDefined();
        expect(typeof response.body.data.token).toBe('string');
        expect(response.body.data.token.split('.')).toHaveLength(3);

        // Save token for later tests
        authToken = response.body.data.token;
      });

      it('should not return password in user object', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
            password: validUserData.password,
          })
          .expect(200);

        expect(response.body.data.user).not.toHaveProperty('password');
      });
    });

    describe('Wrong Credentials Cases', () => {
      it('should return 401 with wrong password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('message');
      });

      it('should return 401 with non-existent email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: validUserData.password,
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            password: validUserData.password,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: validUserData.email,
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  // ============================================
  // GET /api/auth/me
  // ============================================
  describe('GET /api/auth/me', () => {
    // Register and login before getMe tests
    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(validUserData);
      authToken = registerResponse.body.data.token;
    });

    describe('With Valid Token', () => {
      it('should return current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.email).toBe(validUserData.email);
        expect(response.body.data.user.firstName).toBe(validUserData.firstName);
        expect(response.body.data.user.lastName).toBe(validUserData.lastName);
      });

      it('should not return password in user object', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.user).not.toHaveProperty('password');
      });

      it('should return user role', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.user.role).toBe('user');
      });
    });

    describe('Without Token', () => {
      it('should return 401 without Authorization header', async () => {
        const response = await request(app).get('/api/auth/me').expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('message');
      });

      it('should return 401 with empty Authorization header', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', '')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return 401 with malformed token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return 401 with Bearer prefix missing', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', authToken)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });
});

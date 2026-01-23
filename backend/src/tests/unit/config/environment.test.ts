// environment.test.ts (Member 8 - Testing Lead)
// Unit tests for Environment configuration
// Tests environment variable handling and utility functions

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRE: '24h',
      FRONTEND_URL: 'http://localhost:3000',
      PAYPAL_CLIENT_ID: 'test-client-id',
      PAYPAL_CLIENT_SECRET: 'test-client-secret',
      PAYPAL_MODE: 'sandbox',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('Environment Variables', () => {
    it('should load NODE_ENV', () => {
      const { env } = require('../../../config/environment');
      expect(env.NODE_ENV).toBeDefined();
    });

    it('should load PORT as number', () => {
      const { env } = require('../../../config/environment');
      expect(typeof env.PORT).toBe('number');
      expect(env.PORT).toBe(5000);
    });

    it('should load MONGODB_URI', () => {
      const { env } = require('../../../config/environment');
      expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/test');
    });

    it('should load JWT_SECRET', () => {
      const { env } = require('../../../config/environment');
      expect(env.JWT_SECRET).toBe('test-secret');
    });

    it('should load JWT_EXPIRE with default', () => {
      const { env } = require('../../../config/environment');
      expect(env.JWT_EXPIRE).toBeDefined();
    });

    it('should load FRONTEND_URL', () => {
      const { env } = require('../../../config/environment');
      expect(env.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should load PayPal configuration', () => {
      const { env } = require('../../../config/environment');
      expect(env.PAYPAL_CLIENT_ID).toBe('test-client-id');
      expect(env.PAYPAL_CLIENT_SECRET).toBe('test-client-secret');
      expect(env.PAYPAL_MODE).toBe('sandbox');
    });
  });

  describe('isDevelopment()', () => {
    it('should return false in test mode', () => {
      const { isDevelopment } = require('../../../config/environment');
      expect(isDevelopment()).toBe(false);
    });

    it('should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { isDevelopment } = require('../../../config/environment');
      expect(isDevelopment()).toBe(true);
    });
  });

  describe('isProduction()', () => {
    it('should return false in test mode', () => {
      const { isProduction } = require('../../../config/environment');
      expect(isProduction()).toBe(false);
    });

    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { isProduction } = require('../../../config/environment');
      expect(isProduction()).toBe(true);
    });
  });

  describe('isTest()', () => {
    it('should return true in test mode', () => {
      const { isTest } = require('../../../config/environment');
      expect(isTest()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { isTest } = require('../../../config/environment');
      expect(isTest()).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should use default PORT when not specified', () => {
      delete process.env.PORT;
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.PORT).toBe(5000);
    });

    it('should use default JWT_EXPIRE when not specified', () => {
      delete process.env.JWT_EXPIRE;
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.JWT_EXPIRE).toBe('24h');
    });

    it('should use default FRONTEND_URL when not specified', () => {
      delete process.env.FRONTEND_URL;
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should use default PAYPAL_MODE when not specified', () => {
      delete process.env.PAYPAL_MODE;
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.PAYPAL_MODE).toBe('sandbox');
    });
  });

  describe('Custom PORT', () => {
    it('should use custom PORT when specified', () => {
      process.env.PORT = '3001';
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.PORT).toBe(3001);
    });
  });

  describe('NODE_ENV values', () => {
    it('should default to development when NODE_ENV not specified', () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { env } = require('../../../config/environment');
      expect(env.NODE_ENV).toBe('development');
    });
  });

  describe('Default Export', () => {
    it('should export env as default', () => {
      const defaultExport = require('../../../config/environment').default;
      expect(defaultExport).toBeDefined();
      expect(defaultExport.PORT).toBeDefined();
    });
  });
});

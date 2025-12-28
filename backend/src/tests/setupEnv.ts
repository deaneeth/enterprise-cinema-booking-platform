// Jest setup file: provide required environment variables for tests.
// This runs before any test files are evaluated (setupFiles).

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Required by src/config/environment.ts at import time
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jest-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Optional defaults
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

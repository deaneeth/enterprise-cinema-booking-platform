// setup.ts (Member 8)
// Shared test setup utilities for MongoDB Memory Server
// Provides helper functions that tests can optionally import
// Does NOT use global hooks to avoid breaking existing tests

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Singleton MongoDB Memory Server instance
let mongoServer: MongoMemoryServer | null = null;

/**
 * Connect to an in-memory MongoDB instance for testing
 * Creates a new MongoMemoryServer if one doesn't exist
 * @returns The MongoDB URI for the in-memory database
 */
export const connectTestDb = async (): Promise<string> => {
  // Create MongoDB Memory Server if needed
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }

  const mongoUri = mongoServer.getUri();

  // Disconnect any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);

  return mongoUri;
};

/**
 * Clear all collections in the test database
 * Useful for cleaning up between tests
 */
export const clearTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Drop the test database entirely
 * More aggressive cleanup than clearTestDb
 */
export const dropTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.dropDatabase();
};

/**
 * Disconnect from the test database and stop the server
 * Should be called in afterAll hook
 */
export const disconnectTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

/**
 * Set up test environment variables
 * Call this at the start of your test file
 */
export const setupTestEnv = (): void => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
  process.env.JWT_EXPIRE = '1h';
};

/**
 * Get the current MongoDB Memory Server instance
 * Useful for advanced test scenarios
 */
export const getTestDbServer = (): MongoMemoryServer | null => {
  return mongoServer;
};

/**
 * Check if connected to test database
 */
export const isTestDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Default export with all utilities
export default {
  connectTestDb,
  clearTestDb,
  dropTestDb,
  disconnectTestDb,
  setupTestEnv,
  getTestDbServer,
  isTestDbConnected,
};

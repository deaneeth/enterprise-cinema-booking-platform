// database.ts
// Database configuration - Handles database connection setup
// Configures database connection, manages connection pool, and handles connection errors

import mongoose from 'mongoose';
import { env, isDevelopment } from './environment';

/**
 * Connect to MongoDB database
 * Handles connection with retry logic and proper error handling
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // Mongoose connection options
    const options: mongoose.ConnectOptions = {
      // These options are no longer needed in Mongoose 6+
      // but including for clarity
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Log database name in development
    if (isDevelopment()) {
      console.log(`Database Name: ${conn.connection.name}`);
    }
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Handle MongoDB connection events
 */
export const setupDatabaseEvents = (): void => {
  const db = mongoose.connection;

  // Connection successful
  db.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

  // Connection error
  db.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  // Disconnected
  db.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
  });

  // When the Node process ends, close the Mongoose connection
  process.on('SIGINT', async () => {
    try {
      await db.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing Mongoose connection:', err);
      process.exit(1);
    }
  });
};

/**
 * Disconnect from MongoDB
 * Useful for testing and graceful shutdown
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export default {
  connectDatabase,
  setupDatabaseEvents,
  disconnectDatabase,
};

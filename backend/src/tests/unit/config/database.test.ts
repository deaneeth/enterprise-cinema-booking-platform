// database.test.ts - Unit tests for database configuration

import mongoose from 'mongoose';

// Mock mongoose before importing database module
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    host: 'localhost',
    name: 'testdb',
    on: jest.fn(),
    close: jest.fn(),
  },
}));

// Mock environment
jest.mock('../../../config/environment', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017/testdb',
  },
  isDevelopment: jest.fn(() => true),
}));

import {
  connectDatabase,
  setupDatabaseEvents,
  disconnectDatabase,
} from '../../../config/database';
import { isDevelopment } from '../../../config/environment';

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connectDatabase', () => {
    it('should connect to MongoDB successfully', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce({
        connection: { host: 'localhost', name: 'testdb' },
      });

      await connectDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb'
      );
      expect(console.log).toHaveBeenCalledWith('MongoDB Connected: localhost');
    });

    it('should log database name in development mode', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce({
        connection: { host: 'localhost', name: 'testdb' },
      });
      (isDevelopment as jest.Mock).mockReturnValue(true);

      await connectDatabase();

      expect(console.log).toHaveBeenCalledWith('Database Name: testdb');
    });

    it('should not log database name in production mode', async () => {
      (mongoose.connect as jest.Mock).mockResolvedValueOnce({
        connection: { host: 'localhost', name: 'testdb' },
      });
      (isDevelopment as jest.Mock).mockReturnValue(false);

      await connectDatabase();

      expect(console.log).not.toHaveBeenCalledWith('Database Name: testdb');
    });

    it('should handle connection error', async () => {
      const mockExit = jest
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);
      const error = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValueOnce(error);

      await connectDatabase();

      expect(console.error).toHaveBeenCalledWith(
        'MongoDB Connection Error:',
        error
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('setupDatabaseEvents', () => {
    it('should setup connection event handlers', () => {
      setupDatabaseEvents();

      expect(mongoose.connection.on).toHaveBeenCalledWith(
        'connected',
        expect.any(Function)
      );
      expect(mongoose.connection.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mongoose.connection.on).toHaveBeenCalledWith(
        'disconnected',
        expect.any(Function)
      );
    });

    it('should log when connected event fires', () => {
      let connectedCallback: Function;
      (mongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, cb: Function) => {
          if (event === 'connected') {
            connectedCallback = cb;
          }
        }
      );

      setupDatabaseEvents();
      connectedCallback!();

      expect(console.log).toHaveBeenCalledWith('Mongoose connected to MongoDB');
    });

    it('should log when error event fires', () => {
      let errorCallback: Function;
      (mongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, cb: Function) => {
          if (event === 'error') {
            errorCallback = cb;
          }
        }
      );

      const testError = new Error('Test error');
      setupDatabaseEvents();
      errorCallback!(testError);

      expect(console.error).toHaveBeenCalledWith(
        'Mongoose connection error:',
        testError
      );
    });

    it('should log when disconnected event fires', () => {
      let disconnectedCallback: Function;
      (mongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, cb: Function) => {
          if (event === 'disconnected') {
            disconnectedCallback = cb;
          }
        }
      );

      setupDatabaseEvents();
      disconnectedCallback!();

      expect(console.log).toHaveBeenCalledWith(
        'Mongoose disconnected from MongoDB'
      );
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect successfully', async () => {
      (mongoose.disconnect as jest.Mock).mockResolvedValueOnce(undefined);

      await disconnectDatabase();

      expect(mongoose.disconnect).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'MongoDB disconnected successfully'
      );
    });

    it('should handle disconnect error', async () => {
      const error = new Error('Disconnect failed');
      (mongoose.disconnect as jest.Mock).mockRejectedValueOnce(error);

      await expect(disconnectDatabase()).rejects.toThrow('Disconnect failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error disconnecting from MongoDB:',
        error
      );
    });
  });
});

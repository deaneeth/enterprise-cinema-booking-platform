// reviewController.test.ts (Member 8 - Testing Lead)
// Unit tests for Review Controller
// Tests controller logic with mocked dependencies

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from '../../../controllers/reviewController';

// Mock models
jest.mock('../../../models/Review', () => {
  const mockReview = {
    _id: 'review123',
    rating: 4,
    comment: 'Great movie!',
    targetType: 'movie',
    targetId: 'movie123',
    userId: 'user123',
    isActive: true,
    populate: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn().mockResolvedValue(mockReview),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockReview]),
            }),
          }),
        }),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReview),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      countDocuments: jest.fn().mockResolvedValue(1),
      getAverageRating: jest
        .fn()
        .mockResolvedValue({ averageRating: 4, totalReviews: 1 }),
    },
    TARGET_TYPES: ['movie', 'cinema'],
  };
});

jest.mock('../../../models/Movie', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ _id: 'movie123', isActive: true }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../models/Cinema', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ _id: 'cinema123', isActive: true }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../models/Booking', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue(null),
  },
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    isValidObjectId: jest.fn().mockReturnValue(true),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
    model: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
      }),
    }),
  };
});

describe('Review Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: new mongoose.Types.ObjectId('user123'),
        id: 'user123',
        role: 'user',
      } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ============================================
  // createReview Tests
  // ============================================
  describe('createReview()', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Not authenticated' },
      });
    });

    it('should return 400 for invalid targetType', async () => {
      mockRequest.body = {
        targetType: 'invalid',
        targetId: 'movie123',
        rating: 4,
      };

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'targetType must be either "movie" or "cinema"' },
      });
    });

    it('should return 400 for invalid targetId', async () => {
      (mongoose.isValidObjectId as jest.Mock).mockReturnValueOnce(false);
      mockRequest.body = {
        targetType: 'movie',
        targetId: 'invalid',
        rating: 4,
      };

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Valid targetId is required' },
      });
    });

    it('should return 400 for invalid rating below 1', async () => {
      mockRequest.body = {
        targetType: 'movie',
        targetId: 'movie123',
        rating: 0,
      };

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Rating must be a number between 1 and 5' },
      });
    });

    it('should return 400 for invalid rating above 5', async () => {
      mockRequest.body = {
        targetType: 'movie',
        targetId: 'movie123',
        rating: 6,
      };

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Rating must be a number between 1 and 5' },
      });
    });

    it('should return 400 for missing rating', async () => {
      mockRequest.body = {
        targetType: 'movie',
        targetId: 'movie123',
      };

      await createReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // getReviews Tests
  // ============================================
  describe('getReviews()', () => {
    it('should return reviews with pagination', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      await getReviews(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reviews: expect.any(Array),
            pagination: expect.any(Object),
          }),
        })
      );
    });

    it('should handle targetType filter', async () => {
      mockRequest.query = { targetType: 'movie' };

      await getReviews(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle rating filter', async () => {
      mockRequest.query = { rating: '5' };

      await getReviews(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should default to page 1 for invalid page', async () => {
      mockRequest.query = { page: '-1' };

      await getReviews(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should cap limit at 100', async () => {
      mockRequest.query = { limit: '1000' };

      await getReviews(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================
  // getReviewById Tests
  // ============================================
  describe('getReviewById()', () => {
    it('should return 400 for invalid review ID', async () => {
      (mongoose.isValidObjectId as jest.Mock).mockReturnValueOnce(false);
      mockRequest.params = { id: 'invalid' };

      await getReviewById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Invalid review ID' },
      });
    });

    it('should return review for valid ID', async () => {
      mockRequest.params = { id: 'review123' };

      await getReviewById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================
  // updateReview Tests
  // ============================================
  describe('updateReview()', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'review123' };

      await updateReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid review ID', async () => {
      (mongoose.isValidObjectId as jest.Mock).mockReturnValueOnce(false);
      mockRequest.params = { id: 'invalid' };

      await updateReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  // ============================================
  // deleteReview Tests
  // ============================================
  describe('deleteReview()', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'review123' };

      await deleteReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid review ID', async () => {
      (mongoose.isValidObjectId as jest.Mock).mockReturnValueOnce(false);
      mockRequest.params = { id: 'invalid' };

      await deleteReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});

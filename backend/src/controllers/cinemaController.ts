// cinemaController.ts (Member 2)
// Cinema controller - Contains business logic for cinema-related operations
// Handles cinema listing, filtering, details retrieval, and cinema management

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Cinema from '../models/Cinema';
// Ensure Express Request type is extended with user property
import '../middlewares/auth';

const parseFacilitiesQuery = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const isValidObjectId = (id: unknown): id is string => {
  return typeof id === 'string' && mongoose.isValidObjectId(id);
};

/**
 * Validate location object structure and coordinate ranges
 */
const validateLocation = (location: unknown): string | null => {
  if (location === null || location === undefined) {
    return null; // location is optional
  }

  if (typeof location !== 'object' || Array.isArray(location)) {
    return 'location must be an object';
  }

  const loc = location as Record<string, unknown>;

  // Validate coordinates if provided
  if (loc.coordinates !== undefined) {
    if (
      typeof loc.coordinates !== 'object' ||
      loc.coordinates === null ||
      Array.isArray(loc.coordinates)
    ) {
      return 'location.coordinates must be an object';
    }

    const coords = loc.coordinates as Record<string, unknown>;

    if (coords.lat !== undefined) {
      if (typeof coords.lat !== 'number' || !Number.isFinite(coords.lat)) {
        return 'location.coordinates.lat must be a valid number';
      }
      if (coords.lat < -90 || coords.lat > 90) {
        return 'location.coordinates.lat must be between -90 and 90';
      }
    }

    if (coords.lng !== undefined) {
      if (typeof coords.lng !== 'number' || !Number.isFinite(coords.lng)) {
        return 'location.coordinates.lng must be a valid number';
      }
      if (coords.lng < -180 || coords.lng > 180) {
        return 'location.coordinates.lng must be between -180 and 180';
      }
    }

    // If coordinates object is provided, both lat and lng should be present
    if (
      (coords.lat !== undefined && coords.lng === undefined) ||
      (coords.lat === undefined && coords.lng !== undefined)
    ) {
      return 'location.coordinates must include both lat and lng properties';
    }
  }

  return null; // validation passed
};

/**
 * Create a new cinema (platform admin only)
 * POST /api/cinemas
 */
export const createCinema = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    if (req.user.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Platform admin only.' },
      });
      return;
    }

    const {
      name,
      chain,
      location,
      facilities,
      adminUserId,
      screens,
      isActive,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'Cinema name is required' },
      });
      return;
    }

    if (
      adminUserId !== undefined &&
      adminUserId !== null &&
      !isValidObjectId(adminUserId)
    ) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid adminUserId' },
      });
      return;
    }

    if (screens !== undefined && screens !== null) {
      const screensNumber = Number(screens);
      if (!Number.isFinite(screensNumber) || screensNumber < 0) {
        res.status(400).json({
          success: false,
          error: { message: 'screens must be a non-negative number' },
        });
        return;
      }
    }

    // Validate location structure and coordinates
    const locationError = validateLocation(location);
    if (locationError) {
      res.status(400).json({
        success: false,
        error: { message: locationError },
      });
      return;
    }

    const facilitiesArray: string[] = Array.isArray(facilities)
      ? facilities
          .filter((f: unknown) => typeof f === 'string')
          .map((f: string) => f.trim())
          .filter(Boolean)
      : typeof facilities === 'string'
        ? facilities
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const cinema = await Cinema.create({
      name: name.trim(),
      chain: typeof chain === 'string' ? chain.trim() : undefined,
      location,
      facilities: facilitiesArray,
      adminUserId: adminUserId
        ? new mongoose.Types.ObjectId(adminUserId)
        : undefined,
      screens:
        screens !== undefined && screens !== null ? Number(screens) : undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    });

    res.status(201).json({
      success: true,
      data: { cinema },
    });
  } catch (error: unknown) {
    console.error('Create cinema error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error creating cinema' },
    });
  }
};

/**
 * Get all cinemas with optional filters
 * GET /api/cinemas?city=Colombo&facilities=IMAX,3D&limit=10&skip=0
 */
export const getAllCinemas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { city, limit, skip } = req.query;
    const facilities = parseFacilitiesQuery(req.query.facilities);

    // Parse pagination parameters
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const skipNum = skip ? parseInt(skip as string, 10) : 0;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: { message: 'limit must be a number between 1 and 100' },
      });
      return;
    }

    if (isNaN(skipNum) || skipNum < 0) {
      res.status(400).json({
        success: false,
        error: { message: 'skip must be a non-negative number' },
      });
      return;
    }

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (city !== undefined) {
      if (typeof city !== 'string' || !city.trim()) {
        res.status(400).json({
          success: false,
          error: { message: 'city must be a non-empty string' },
        });
        return;
      }
      filter['location.city'] = city.trim();
    }

    if (facilities.length > 0) {
      // Require all facilities in the query to be present in cinema.facilities
      filter.facilities = { $all: facilities };
    }

    const cinemas = await Cinema.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum);

    const total = await Cinema.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        cinemas,
        pagination: {
          total,
          limit: limitNum,
          skip: skipNum,
        },
      },
    });
  } catch (error) {
    console.error('Get all cinemas error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching cinemas' },
    });
  }
};

/**
 * Get cinema by ID
 * GET /api/cinemas/:id
 */
export const getCinemaById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid cinema id' },
      });
      return;
    }

    const cinema = await Cinema.findById(id);

    if (!cinema || !cinema.isActive) {
      res.status(404).json({
        success: false,
        error: { message: 'Cinema not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { cinema },
    });
  } catch (error) {
    console.error('Get cinema by id error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error fetching cinema' },
    });
  }
};

/**
 * Update cinema (cinema admin of that cinema or platform admin)
 * PUT /api/cinemas/:id
 */
export const updateCinema = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid cinema id' },
      });
      return;
    }

    const isPlatformAdmin = req.user.role === 'platform_admin';
    const isCinemaAdmin = req.user.role === 'cinema_admin';

    if (!isPlatformAdmin && !isCinemaAdmin) {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' },
      });
      return;
    }

    if (isCinemaAdmin) {
      const userCinemaId = req.user.cinemaId?.toString();
      if (!userCinemaId || userCinemaId !== id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. You can only update your own cinema.',
          },
        });
        return;
      }
    }

    const cinema = await Cinema.findById(id);
    if (!cinema) {
      res.status(404).json({
        success: false,
        error: { message: 'Cinema not found' },
      });
      return;
    }

    const {
      name,
      chain,
      location,
      facilities,
      adminUserId,
      screens,
      isActive,
    } = req.body;

    // Cinema admins can only update a safe subset of fields
    const allowAdminUserIdChange = isPlatformAdmin;
    const allowActiveChange = isPlatformAdmin;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          error: { message: 'name must be a non-empty string' },
        });
        return;
      }
      cinema.name = name.trim();
    }

    if (chain !== undefined) {
      if (chain !== null && typeof chain !== 'string') {
        res.status(400).json({
          success: false,
          error: { message: 'chain must be a string' },
        });
        return;
      }
      cinema.chain = typeof chain === 'string' ? chain.trim() : undefined;
    }

    if (location !== undefined) {
      // Validate location structure and coordinates
      const locationError = validateLocation(location);
      if (locationError) {
        res.status(400).json({
          success: false,
          error: { message: locationError },
        });
        return;
      }
      cinema.location = location;
    }

    if (facilities !== undefined) {
      const facilitiesArray: string[] = Array.isArray(facilities)
        ? facilities
            .filter((f: unknown) => typeof f === 'string')
            .map((f: string) => f.trim())
            .filter(Boolean)
        : typeof facilities === 'string'
          ? facilities
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

      cinema.facilities = facilitiesArray;
    }

    if (screens !== undefined) {
      const screensNumber = Number(screens);
      if (!Number.isFinite(screensNumber) || screensNumber < 0) {
        res.status(400).json({
          success: false,
          error: { message: 'screens must be a non-negative number' },
        });
        return;
      }
      cinema.screens = screensNumber;
    }

    if (adminUserId !== undefined) {
      if (!allowAdminUserIdChange) {
        res.status(403).json({
          success: false,
          error: { message: 'Only platform admins can change adminUserId' },
        });
        return;
      }
      if (adminUserId !== null && !isValidObjectId(adminUserId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid adminUserId' },
        });
        return;
      }
      cinema.adminUserId = adminUserId
        ? new mongoose.Types.ObjectId(adminUserId)
        : undefined;
    }

    if (isActive !== undefined) {
      if (!allowActiveChange) {
        res.status(403).json({
          success: false,
          error: { message: 'Only platform admins can change isActive' },
        });
        return;
      }
      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          error: { message: 'isActive must be a boolean' },
        });
        return;
      }
      cinema.isActive = isActive;
    }

    await cinema.save();

    res.status(200).json({
      success: true,
      data: { cinema },
    });
  } catch (error: unknown) {
    console.error('Update cinema error:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error updating cinema' },
    });
  }
};

/**
 * Soft delete cinema (set isActive=false)
 * DELETE /api/cinemas/:id
 */
export const deleteCinema = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    if (req.user.role !== 'platform_admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Platform admin only.' },
      });
      return;
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid cinema id' },
      });
      return;
    }

    const cinema = await Cinema.findById(id);
    if (!cinema) {
      res.status(404).json({
        success: false,
        error: { message: 'Cinema not found' },
      });
      return;
    }

    if (!cinema.isActive) {
      res.status(409).json({
        success: false,
        error: { message: 'Cinema is already inactive' },
      });
      return;
    }
    cinema.isActive = false;
    await cinema.save();

    res.status(200).json({
      success: true,
      data: { cinema },
    });
  } catch (error) {
    console.error('Delete cinema error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error deleting cinema' },
    });
  }
};

/**
 * Search cinemas by name or city
 * GET /api/cinemas/search?q=colombo&limit=10&skip=0
 */
export const searchCinemas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { q, limit, skip } = req.query;

    if (typeof q !== 'string' || !q.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'q query parameter is required' },
      });
      return;
    }

    // Parse pagination parameters
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const skipNum = skip ? parseInt(skip as string, 10) : 0;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: { message: 'limit must be a number between 1 and 100' },
      });
      return;
    }

    if (isNaN(skipNum) || skipNum < 0) {
      res.status(400).json({
        success: false,
        error: { message: 'skip must be a non-negative number' },
      });
      return;
    }

    const term = q.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const filter = {
      isActive: true,
      $or: [{ name: regex }, { 'location.city': regex }],
    };

    const cinemas = await Cinema.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum);

    const total = await Cinema.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        cinemas,
        pagination: {
          total,
          limit: limitNum,
          skip: skipNum,
        },
      },
    });
  } catch (error) {
    console.error('Search cinemas error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error searching cinemas' },
    });
  }
};

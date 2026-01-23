// applicationController.ts
// Handles cinema admin application workflow
// Apply for cinema admin, list pending applications, approve/reject

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Cinema from '../models/Cinema';

// POST /api/auth/apply-cinema-admin
// Users can apply to become cinema admins
export const applyCinemaAdmin = async (req: Request, res: Response) => {
  try {
    const { businessName, businessAddress, businessLicense } = req.body;

    if (!businessName || !businessAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Business name and address are required' },
      });
    }

    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Check if already applied or already a cinema admin
    if (user.role === 'cinema_admin') {
      return res.status(400).json({
        success: false,
        error: { message: 'You are already a cinema admin' },
      });
    }

    if (user.applicationStatus === 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'You already have a pending application' },
      });
    }

    // Update user with application details
    user.applicationStatus = 'pending';
    user.applicationDetails = {
      businessName,
      businessAddress,
      businessLicense,
      appliedAt: new Date(),
    };
    await user.save();

    res.json({
      success: true,
      message: 'Application submitted successfully. Please wait for approval.',
      data: {
        applicationStatus: user.applicationStatus,
        appliedAt: user.applicationDetails?.appliedAt,
      },
    });
  } catch (error) {
    console.error('Error applying for cinema admin:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit application' },
    });
  }
};

// GET /api/admin/applications
// Platform admin: List all pending applications
export const listApplications = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter: { applicationStatus?: string | { $ne: string } } = {};
    if (status === 'pending') {
      filter.applicationStatus = 'pending';
    } else if (status === 'all') {
      filter.applicationStatus = { $ne: 'none' };
    } else {
      filter.applicationStatus = 'pending'; // Default to pending
    }

    const applications = await User.find(filter)
      .select(
        'firstName lastName email applicationStatus applicationDetails createdAt'
      )
      .sort({ 'applicationDetails.appliedAt': -1 });

    res.json({
      success: true,
      data: applications.map((user) => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        applicationStatus: user.applicationStatus,
        businessName: user.applicationDetails?.businessName,
        businessAddress: user.applicationDetails?.businessAddress,
        businessLicense: user.applicationDetails?.businessLicense,
        appliedAt: user.applicationDetails?.appliedAt,
        reviewedAt: user.applicationDetails?.reviewedAt,
      })),
    });
  } catch (error) {
    console.error('Error listing applications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list applications' },
    });
  }
};

// PUT /api/admin/applications/:userId/approve
// Platform admin: Approve an application and optionally assign a cinema
export const approveApplication = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { cinemaId, createCinema } = req.body;
    const reviewerId = (req as { user?: { id?: string } }).user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid user ID' },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    if (user.applicationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'No pending application for this user' },
      });
    }

    let assignedCinemaId = cinemaId;

    // If createCinema is true, create a new cinema from application details
    if (createCinema && user.applicationDetails?.businessName) {
      const newCinema = await Cinema.create({
        name: user.applicationDetails.businessName,
        location: {
          address: user.applicationDetails.businessAddress || '',
          city: 'TBD',
          state: 'TBD',
          country: 'TBD',
          zipCode: '00000',
        },
        isActive: true,
      });
      assignedCinemaId = newCinema._id.toString();
    }

    // Update user to cinema_admin role
    user.role = 'cinema_admin';
    user.applicationStatus = 'approved';
    user.applicationDetails = {
      ...user.applicationDetails,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    };

    if (assignedCinemaId) {
      user.cinemaId = new mongoose.Types.ObjectId(assignedCinemaId);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Application approved successfully',
      data: {
        userId: user._id,
        role: user.role,
        cinemaId: user.cinemaId,
      },
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve application' },
    });
  }
};

// PUT /api/admin/applications/:userId/reject
// Platform admin: Reject an application with reason
export const rejectApplication = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const reviewerId = (req as { user?: { id?: string } }).user?.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid user ID' },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    if (user.applicationStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: { message: 'No pending application for this user' },
      });
    }

    // Update application status to rejected
    user.applicationStatus = 'rejected';
    user.applicationDetails = {
      ...user.applicationDetails,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason: reason || 'Application does not meet requirements',
    };

    await user.save();

    res.json({
      success: true,
      message: 'Application rejected',
      data: {
        userId: user._id,
        applicationStatus: user.applicationStatus,
      },
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject application' },
    });
  }
};

// GET /api/auth/my-application
// Get current user's application status
export const getMyApplication = async (req: Request, res: Response) => {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    const user = await User.findById(userId).select(
      'applicationStatus applicationDetails role'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: {
        role: user.role,
        applicationStatus: user.applicationStatus || 'none',
        applicationDetails: user.applicationDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch application status' },
    });
  }
};

// payments.ts (Member 7)
// Payment routes - Defines API endpoints for payment-related operations
// Handles routes for PayPal payment processing, verification, refunds, and transaction history

import { Router } from 'express';
import {
  createPayPalOrder,
  capturePayPalPayment,
  cancelPayment,
  getUserPayments,
  getPaymentById,
  processRefund,
  getAllPayments,
} from '../controllers/paymentController';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// ============================================
// PROTECTED ROUTES (Authenticated Users)
// ============================================

/**
 * @route   POST /api/payments/create-order
 * @desc    Create a PayPal order for a pending booking
 * @access  Private (Authenticated users)
 * @body    { bookingId: string }
 * @returns { orderId: string, approvalUrl: string }
 */
router.post('/payments/create-order', authenticate, createPayPalOrder);

/**
 * @route   POST /api/payments/capture
 * @desc    Capture payment after user approves in PayPal
 * @access  Private (Authenticated users)
 * @body    { orderId: string }
 * @returns { success: boolean, payment: Payment, booking: Booking }
 */
router.post('/payments/capture', authenticate, capturePayPalPayment);

/**
 * @route   POST /api/payments/cancel
 * @desc    Cancel a pending payment (user cancelled in PayPal)
 * @access  Private (Authenticated users)
 * @body    { orderId: string }
 * @returns { message: string }
 */
router.post('/payments/cancel', authenticate, cancelPayment);

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get all payments for the current user
 * @access  Private (Authenticated users)
 * @returns Array of payments with populated booking details
 */
router.get('/payments/my-payments', authenticate, getUserPayments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get a specific payment by ID
 * @access  Private (Payment owner or Admin)
 * @returns Payment with all populated relations
 */
router.get('/payments/:id', authenticate, getPaymentById);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund for a completed payment
 * @access  Private (Payment owner or Admin)
 * @returns { payment: Payment, refundId: string, refundAmount: string }
 */
router.post('/payments/:id/refund', authenticate, processRefund);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/payments
 * @desc    Get all payments with filters (Admin only)
 * @access  Private (Platform Admin only)
 * @query   userId (optional): filter by user
 * @query   status (optional): pending | completed | failed | refunded | cancelled
 * @query   startDate (optional): filter from date
 * @query   endDate (optional): filter to date
 * @query   page (optional): page number for pagination
 * @query   limit (optional): items per page
 * @returns { payments: Payment[], pagination: { page, limit, total, pages } }
 */
router.get(
  '/payments',
  authenticate,
  requireRole('platform_admin'),
  getAllPayments
);

export default router;

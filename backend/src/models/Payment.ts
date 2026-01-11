// Payment.ts (Member 7)
// Payment model - Defines the payment schema/entity for transaction processing
// Handles payment data structure including PayPal integration, amount, status, and transaction details

import mongoose, { Schema, Document, Model } from 'mongoose';

/* =======================
  Payment Details Interface
======================= */
export interface PaymentDetails {
  cardBrand?: string; // Visa, Mastercard, etc. (if card payment)
  cardLastFour?: string; // Last 4 digits (if card payment)
}

/* =======================
  Payment Document Type
======================= */
export interface PaymentDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'paypal' | 'card';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  payerEmail?: string;
  payerName?: string;
  paymentDate?: Date;
  refundDate?: Date;
  paymentDetails?: PaymentDetails;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canRefund(): boolean;
  isExpired(): boolean;
}

/* =======================
  Payment Model Interface (with statics)
======================= */
export interface PaymentModel extends Model<PaymentDocument> {
  findByPayPalOrderId(orderId: string): Promise<PaymentDocument | null>;
}

/* =======================
  Payment Details Sub-Schema
======================= */
const PaymentDetailsSchema = new Schema<PaymentDetails>(
  {
    cardBrand: {
      type: String,
      trim: true,
    },
    cardLastFour: {
      type: String,
      trim: true,
      maxlength: 4,
    },
  },
  { _id: false }
);

/* =======================
  Payment Schema
======================= */
const PaymentSchema = new Schema<PaymentDocument, PaymentModel>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['paypal', 'card'],
        message: 'Payment method must be paypal or card',
      },
      default: 'paypal',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
        message:
          'Payment status must be pending, completed, failed, refunded, or cancelled',
      },
      default: 'pending',
    },
    paypalOrderId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values while maintaining uniqueness for non-null
      trim: true,
    },
    paypalCaptureId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    paypalRefundId: {
      type: String,
      sparse: true,
      trim: true,
    },
    payerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    payerName: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
    },
    refundDate: {
      type: Date,
    },
    paymentDetails: {
      type: PaymentDetailsSchema,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =======================
  Indexes
======================= */

// Index on paypalOrderId for quick lookups during capture
PaymentSchema.index({ paypalOrderId: 1 });

// Index on userId for fetching user's payments
PaymentSchema.index({ userId: 1 });

// Index on paymentStatus for filtering
PaymentSchema.index({ paymentStatus: 1 });

// Compound index for common queries
PaymentSchema.index({ userId: 1, paymentStatus: 1, createdAt: -1 });

/* =======================
  Virtuals for Population
======================= */

// Virtual populate for booking details
PaymentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for user details
PaymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/* =======================
  Instance Methods
======================= */

/**
 * Check if payment can be refunded
 * Payment must be completed and within 180 days (PayPal refund policy)
 * @returns Boolean indicating if payment can be refunded
 */
PaymentSchema.methods.canRefund = function (): boolean {
  // Payment must be completed to be refundable
  if (this.paymentStatus !== 'completed') {
    return false;
  }

  // Must have a capture ID to process refund
  if (!this.paypalCaptureId) {
    return false;
  }

  // Check if within 180 days (PayPal's refund window)
  const paymentDate = this.paymentDate || this.createdAt;
  const daysSincePayment = Math.floor(
    (Date.now() - new Date(paymentDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSincePayment <= 180;
};

/**
 * Check if pending payment is expired
 * Payments expire after 10 minutes if not completed
 * @returns Boolean indicating if payment has expired
 */
PaymentSchema.methods.isExpired = function (): boolean {
  // Only pending payments can expire
  if (this.paymentStatus !== 'pending') {
    return false;
  }

  // Check if more than 10 minutes have passed since creation
  const tenMinutesInMs = 10 * 60 * 1000;
  const timeSinceCreation = Date.now() - new Date(this.createdAt).getTime();

  return timeSinceCreation > tenMinutesInMs;
};

/* =======================
  Static Methods
======================= */

/**
 * Find payment by PayPal Order ID
 * @param orderId - PayPal order ID
 * @returns Payment document or null
 */
PaymentSchema.statics.findByPayPalOrderId = async function (
  orderId: string
): Promise<PaymentDocument | null> {
  return this.findOne({ paypalOrderId: orderId });
};

/* =======================
  Pre-save Middleware
======================= */

// Set payment date when status changes to completed
PaymentSchema.pre('save', function (next) {
  if (this.isModified('paymentStatus')) {
    if (this.paymentStatus === 'completed' && !this.paymentDate) {
      this.paymentDate = new Date();
    }
    if (this.paymentStatus === 'refunded' && !this.refundDate) {
      this.refundDate = new Date();
    }
  }
  next();
});

/* =======================
  Export Model
======================= */
const Payment = mongoose.model<PaymentDocument, PaymentModel>(
  'Payment',
  PaymentSchema
);

export default Payment;

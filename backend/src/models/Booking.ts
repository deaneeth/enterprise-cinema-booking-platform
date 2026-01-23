// Booking.ts (Member 5)
// Booking model - Defines the booking schema/entity for ticket reservations
// Handles booking data structure including user, showtime, seats, and booking status

import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

/* =======================
  Booking Document Type
======================= */
export interface BookingDocument extends Document {
  userId: mongoose.Types.ObjectId;
  showtimeId: mongoose.Types.ObjectId;
  seatIds: mongoose.Types.ObjectId[];
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  bookingDate: Date;
  paymentId?: mongoose.Types.ObjectId;
  qrCode?: string;
  expiresAt?: Date; // When booking hold expires (single source of truth)
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  generateQRCode(): string;
  canCancel(): Promise<boolean>;
}

/* =======================
  Booking Schema
======================= */
const BookingSchema = new Schema<BookingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime ID is required'],
    },
    seatIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Seat',
      required: [true, 'At least one seat is required'],
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) => value.length > 0,
        message: 'At least one seat must be selected',
      },
    },
    numberOfSeats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'At least one seat must be booked'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'expired'],
        message:
          'Booking status must be pending, confirmed, cancelled, or expired',
      },
      default: 'pending',
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    qrCode: {
      type: String,
    },
    expiresAt: {
      type: Date,
      // Optional for backward compatibility with existing bookings
      // Required for new bookings (set in controller)
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =======================
  Virtuals for Population
======================= */

// Virtual populate for user details
BookingSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for showtime details
BookingSchema.virtual('showtime', {
  ref: 'Showtime',
  localField: 'showtimeId',
  foreignField: '_id',
  justOne: true,
});

// Virtual populate for seat details
BookingSchema.virtual('seats', {
  ref: 'Seat',
  localField: 'seatIds',
  foreignField: '_id',
});

/* =======================
  Pre-save Middleware
======================= */
BookingSchema.pre('save', function (next) {
  // Ensure expiresAt is set (Phase 5 requirement)
  if (!this.expiresAt) {
    // Default to +10 minutes from now if not explicitly set
    this.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  }
  next();
});

/* =======================
  Post-save Middleware - Seat Status Sync
======================= */
BookingSchema.post('save', async function (doc: BookingDocument) {
  try {
    if (!doc.seatIds || doc.seatIds.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Seat: any;
    try {
      Seat = mongoose.model('Seat');
    } catch {
      return;
    }

    if (doc.bookingStatus === 'expired' || doc.bookingStatus === 'cancelled') {
      await Seat.updateMany(
        {
          _id: { $in: doc.seatIds },
          bookingId: doc._id,
          status: { $ne: 'booked' },
        },
        {
          $set: {
            status: 'available',
            heldBy: null,
            heldUntil: null,
            bookingId: null,
          },
        }
      );
    }
  } catch (error) {
    console.error(`[Booking Post-Save] Error:`, error);
  }
});

/* =======================
  Instance Methods
======================= */

/**
 * Generates a unique QR code string for ticket verification
 * The QR code includes booking ID, timestamp, and a secure hash
 * @returns Unique QR code string
 */
BookingSchema.methods.generateQRCode = function (): string {
  const bookingId = this._id.toString();
  const timestamp = Date.now().toString();
  const secret = process.env.QR_SECRET || 'cinema-booking-secret';

  // Create a secure hash combining booking ID, timestamp, and secret
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${bookingId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  // Format: BOOK-{shortId}-{hash}
  const shortId = bookingId.substring(bookingId.length - 6).toUpperCase();
  const qrCode = `BOOK-${shortId}-${hash.toUpperCase()}`;

  // Save the QR code to the document
  this.qrCode = qrCode;

  return qrCode;
};

/**
 * Checks if the booking can be cancelled
 * A booking can only be cancelled if:
 * 1. The booking status is not already 'cancelled'
 * 2. The showtime has not started yet
 * @returns Promise<boolean> - true if booking can be cancelled
 */
BookingSchema.methods.canCancel = async function (): Promise<boolean> {
  // Cannot cancel an already cancelled or expired booking
  if (this.bookingStatus === 'cancelled' || this.bookingStatus === 'expired') {
    return false;
  }

  // Get the showtime to check if it has started
  const Showtime = mongoose.model('Showtime');
  const showtime = await Showtime.findById(this.showtimeId).select('startTime');

  if (!showtime) {
    return false;
  }

  // Can only cancel if showtime hasn't started yet
  const now = new Date();
  return showtime.startTime > now;
};

/* =======================
  Indexes
======================= */

// Index for user's bookings lookup
BookingSchema.index({ userId: 1, bookingDate: -1 });

// Index for showtime's bookings
BookingSchema.index({ showtimeId: 1 });

// Index for filtering by status
BookingSchema.index({ bookingStatus: 1 });

// Compound index for admin queries
BookingSchema.index({ bookingStatus: 1, bookingDate: -1 });

// UNIQUE partial index to prevent duplicate pending bookings for same user+showtime
// This ensures at the database level that a user can only have ONE pending booking per showtime
BookingSchema.index(
  { userId: 1, showtimeId: 1 },
  {
    unique: true,
    partialFilterExpression: { bookingStatus: 'pending' },
    name: 'unique_pending_booking_per_user_showtime',
  }
);

/* =======================
  Model Export
======================= */

const Booking = mongoose.model<BookingDocument>('Booking', BookingSchema);

export default Booking;

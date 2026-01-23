// Seat.ts (Member 6)
// Seat model - Defines the seat schema/entity for cinema seating
// Handles seat data structure including seat number, type, availability, and pricing
import mongoose, { Schema, Document } from 'mongoose';

/* =======================
  Seat Document Type
======================= */
export interface SeatDocument extends Document {
  showtimeId: mongoose.Types.ObjectId;
  seatNumber: string;
  row: string;
  column: number;
  seatType: 'regular' | 'vip' | 'wheelchair';
  status: 'available' | 'held' | 'booked';
  heldBy?: mongoose.Types.ObjectId;
  heldUntil?: Date;
  bookingId?: mongoose.Types.ObjectId;
  price: number;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isAvailable(): boolean;
  isExpired(): boolean;
}

/* =======================
  Seat Schema
======================= */
const SeatSchema = new Schema<SeatDocument>(
  {
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime ID is required'],
      index: true,
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      // Format: A1, B5, etc.
    },
    row: {
      type: String,
      required: [true, 'Row is required'],
      index: true,
    },
    column: {
      type: Number,
      required: [true, 'Column is required'],
    },
    seatType: {
      type: String,
      enum: {
        values: ['regular', 'vip', 'wheelchair'],
        message: 'Seat type must be regular, vip, or wheelchair',
      },
      default: 'regular',
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'held', 'booked'],
        message: 'Status must be available, held, or booked',
      },
      default: 'available',
      index: true,
    },
    heldBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    heldUntil: {
      type: Date,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
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
SeatSchema.index({ showtimeId: 1, status: 1 });
SeatSchema.index({ showtimeId: 1, row: 1, column: 1 });

/* =======================
  Instance Methods
======================= */

/**
 * Check if seat is available
 * @returns {boolean} True if seat is available
 */
SeatSchema.methods.isAvailable = function (this: SeatDocument): boolean {
  return this.status === 'available';
};

/**
 * Check if hold has expired
 * @returns {boolean} True if held seat's hold period has expired
 */
SeatSchema.methods.isExpired = function (this: SeatDocument): boolean {
  if (!this.heldUntil) return false;
  return new Date() > this.heldUntil;
};

/* =======================
  Static Methods
======================= */

/**
 * Generate seats for a showtime
 * Standard layout: 10 rows (A-J) × 10 columns (1-10) = 100 seats
 * First 2 rows are VIP
 *
 * @param {string} showtimeId - Showtime ID
 * @param {number} totalSeats - Total number of seats to generate
 * @param {object} layout - Seat layout configuration
 * @returns {Promise<any[]>} Created seat documents
 */
SeatSchema.statics.generateSeatsForShowtime = async function (
  showtimeId: string,
  _totalSeats: number = 100, // Prefixed with _ as layout determines actual seat count
  layout?: { rows?: number; cols?: number }
): Promise<any[]> {
  const rows = layout?.rows || 10;
  const cols = layout?.cols || 10;
  const rowLetters = Array.from({ length: rows }, (_, i) =>
    String.fromCharCode(65 + i)
  ); // A, B, C, ...

  const seats: any[] = [];

  for (const row of rowLetters) {
    for (let col = 1; col <= cols; col++) {
      const seatNumber = `${row}${col}`;
      // First 2 rows are VIP
      const isVIP = row === 'A' || row === 'B';
      const basePrice = 500; // Base price in currency units
      const price = isVIP ? basePrice * 1.5 : basePrice;

      seats.push({
        showtimeId,
        seatNumber,
        row,
        column: col,
        seatType: isVIP ? 'vip' : 'regular',
        status: 'available',
        price,
      });
    }
  }

  try {
    const createdSeats = await this.insertMany(seats);
    return createdSeats;
  } catch (error) {
    throw new Error(`Failed to generate seats: ${(error as Error).message}`);
  }
};

/* =======================
  Model Export
======================= */
export const SeatModel = mongoose.model<SeatDocument>('Seat', SeatSchema);
export default SeatModel;

// qrcode.ts (Member 5)
// QR Code service - Handles QR code generation for booking confirmations
// Generates QR codes for tickets, manages QR code validation, and ticket verification

import QRCode from 'qrcode';
import crypto from 'crypto';

/* =======================
  Types and Interfaces
======================= */

/**
 * QR code payload structure
 * Contains booking ID, timestamp, and verification checksum
 */
export interface QRCodePayload {
  bookingId: string;
  timestamp: number;
  checksum: string;
}

/* =======================
  Constants
======================= */

// Characters used for generating booking reference codes
const REFERENCE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Default secret for QR code generation (should be set in environment)
const DEFAULT_QR_SECRET = 'cinema-booking-secret';

/* =======================
  QR Code Generation
======================= */

/**
 * Generates a unique QR code for a booking
 * The QR code contains booking ID and verification checksum
 *
 * @param bookingId - The booking ID to generate QR code for
 * @returns Promise<string> - Base64 data URL of the QR code image
 * @throws Error if QR code generation fails
 */
export const generateBookingQRCode = async (
  bookingId: string
): Promise<string> => {
  try {
    // Create a verification checksum using booking ID and secret
    const secret = process.env.QR_SECRET || DEFAULT_QR_SECRET;
    const timestamp = Date.now();
    const checksum = crypto
      .createHmac('sha256', secret)
      .update(`${bookingId}:${timestamp}`)
      .digest('hex')
      .substring(0, 16);

    const payload: QRCodePayload = {
      bookingId,
      timestamp,
      checksum,
    };

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      errorCorrectionLevel: 'H', // High error correction for durability
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/* =======================
  QR Code Validation
======================= */

/**
 * Validates a QR code payload for ticket verification
 * Used by cinema staff to verify tickets at entrance
 *
 * @param payload - The decoded QR code payload
 * @returns boolean - true if the checksum is valid
 */
export const validateQRCode = (payload: QRCodePayload): boolean => {
  try {
    const secret = process.env.QR_SECRET || DEFAULT_QR_SECRET;
    const expectedChecksum = crypto
      .createHmac('sha256', secret)
      .update(`${payload.bookingId}:${payload.timestamp}`)
      .digest('hex')
      .substring(0, 16);

    return payload.checksum === expectedChecksum;
  } catch (error) {
    console.error('QR code validation error:', error);
    return false;
  }
};

/**
 * Parses and validates a QR code string
 * Combines parsing and validation into a single function
 *
 * @param qrCodeData - The raw QR code data string
 * @returns QRCodePayload | null - The validated payload or null if invalid
 */
export const parseAndValidateQRCode = (
  qrCodeData: string
): QRCodePayload | null => {
  try {
    const payload = JSON.parse(qrCodeData) as QRCodePayload;

    // Validate required fields exist
    if (
      !payload.bookingId ||
      !payload.timestamp ||
      !payload.checksum ||
      typeof payload.bookingId !== 'string' ||
      typeof payload.timestamp !== 'number' ||
      typeof payload.checksum !== 'string'
    ) {
      return null;
    }

    // Validate the checksum
    if (!validateQRCode(payload)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('QR code parsing error:', error);
    return null;
  }
};

/* =======================
  Booking Reference Generation
======================= */

/**
 * Generates a simple unique booking reference code
 * Used for display on tickets (e.g., "BK-ABC123")
 *
 * @returns string - A unique booking reference code
 */
export const generateBookingReference = (): string => {
  let reference = 'BK-';
  for (let i = 0; i < 6; i++) {
    reference += REFERENCE_CHARS.charAt(
      Math.floor(Math.random() * REFERENCE_CHARS.length)
    );
  }
  return reference;
};

/**
 * Generates a cryptographically secure booking reference
 * Uses crypto.randomBytes for better randomness
 *
 * @returns string - A unique, secure booking reference code
 */
export const generateSecureBookingReference = (): string => {
  const randomBytes = crypto.randomBytes(4);
  const reference = randomBytes.toString('hex').toUpperCase().substring(0, 6);
  return `BK-${reference}`;
};

/* =======================
  QR Code String Generation
======================= */

/**
 * Generates a simple QR code string for the booking
 * This is the string value that gets stored in the booking document
 * Format: BOOK-{shortId}-{hash}
 *
 * @param bookingId - The booking ID
 * @returns string - A unique QR code identifier string
 */
export const generateQRCodeString = (bookingId: string): string => {
  const timestamp = Date.now().toString();
  const secret = process.env.QR_SECRET || DEFAULT_QR_SECRET;

  // Create a secure hash combining booking ID, timestamp, and secret
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${bookingId}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  // Format: BOOK-{shortId}-{hash}
  const shortId = bookingId.substring(bookingId.length - 6).toUpperCase();
  return `BOOK-${shortId}-${hash.toUpperCase()}`;
};

/* =======================
  Ticket Verification
======================= */

/**
 * Checks if a QR code timestamp is within valid range
 * Tickets are typically valid from booking time until showtime
 *
 * @param timestamp - The QR code timestamp
 * @param maxAgeMs - Maximum age in milliseconds (default: 7 days)
 * @returns boolean - true if timestamp is within valid range
 */
export const isQRCodeTimestampValid = (
  timestamp: number,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): boolean => {
  const now = Date.now();
  const age = now - timestamp;
  return age >= 0 && age <= maxAgeMs;
};

/* =======================
  Default Export
======================= */

export default {
  generateBookingQRCode,
  validateQRCode,
  parseAndValidateQRCode,
  generateBookingReference,
  generateSecureBookingReference,
  generateQRCodeString,
  isQRCodeTimestampValid,
};

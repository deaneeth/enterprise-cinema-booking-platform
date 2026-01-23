// qrcode.test.ts (Member 8 - Testing Lead)
// Unit tests for QR Code service
// Tests QR code generation, validation, and reference code generation

import {
  generateBookingQRCode,
  validateQRCode,
  parseAndValidateQRCode,
  generateBookingReference,
  QRCodePayload,
} from '../../../services/qrcode';

// Mock QRCode library
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
}));

describe('QR Code Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.QR_SECRET = 'test-qr-secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ============================================
  // generateBookingQRCode() Tests
  // ============================================
  describe('generateBookingQRCode()', () => {
    it('should generate a QR code data URL', async () => {
      const qrCode = await generateBookingQRCode('booking123');

      expect(qrCode).toBe('data:image/png;base64,mockQRCode');
    });

    it('should call QRCode.toDataURL with correct options', async () => {
      const QRCode = require('qrcode');

      await generateBookingQRCode('booking456');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 300,
        })
      );
    });

    it('should include booking ID in payload', async () => {
      const QRCode = require('qrcode');

      await generateBookingQRCode('myBookingId');

      const call = QRCode.toDataURL.mock.calls[0];
      const payload = JSON.parse(call[0]);
      expect(payload.bookingId).toBe('myBookingId');
    });

    it('should include timestamp in payload', async () => {
      const QRCode = require('qrcode');
      const beforeTime = Date.now();

      await generateBookingQRCode('booking123');

      const afterTime = Date.now();
      const call = QRCode.toDataURL.mock.calls[0];
      const payload = JSON.parse(call[0]);
      expect(payload.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(payload.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include checksum in payload', async () => {
      const QRCode = require('qrcode');

      await generateBookingQRCode('booking123');

      const call = QRCode.toDataURL.mock.calls[0];
      const payload = JSON.parse(call[0]);
      expect(payload.checksum).toBeDefined();
      expect(payload.checksum.length).toBe(16);
    });

    it('should throw error when QR generation fails', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL.mockRejectedValueOnce(new Error('Generation failed'));

      await expect(generateBookingQRCode('booking123')).rejects.toThrow(
        'Failed to generate QR code'
      );
    });

    it('should use default secret when QR_SECRET not set', async () => {
      delete process.env.QR_SECRET;

      const qrCode = await generateBookingQRCode('booking123');

      expect(qrCode).toBe('data:image/png;base64,mockQRCode');
    });
  });

  // ============================================
  // validateQRCode() Tests
  // ============================================
  describe('validateQRCode()', () => {
    it('should return true for valid payload', async () => {
      // Generate a valid payload first
      const QRCode = require('qrcode');
      await generateBookingQRCode('booking123');

      const call = QRCode.toDataURL.mock.calls[0];
      const payload: QRCodePayload = JSON.parse(call[0]);

      const isValid = validateQRCode(payload);

      expect(isValid).toBe(true);
    });

    it('should return false for tampered checksum', () => {
      const payload: QRCodePayload = {
        bookingId: 'booking123',
        timestamp: Date.now(),
        checksum: 'tamperedchecksum1',
      };

      const isValid = validateQRCode(payload);

      expect(isValid).toBe(false);
    });

    it('should return false for tampered bookingId', async () => {
      const QRCode = require('qrcode');
      await generateBookingQRCode('booking123');

      const call = QRCode.toDataURL.mock.calls[0];
      const payload: QRCodePayload = JSON.parse(call[0]);
      payload.bookingId = 'tamperedBookingId';

      const isValid = validateQRCode(payload);

      expect(isValid).toBe(false);
    });

    it('should return false for tampered timestamp', async () => {
      const QRCode = require('qrcode');
      await generateBookingQRCode('booking123');

      const call = QRCode.toDataURL.mock.calls[0];
      const payload: QRCodePayload = JSON.parse(call[0]);
      payload.timestamp = Date.now() + 1000;

      const isValid = validateQRCode(payload);

      expect(isValid).toBe(false);
    });
  });

  // ============================================
  // parseAndValidateQRCode() Tests
  // ============================================
  describe('parseAndValidateQRCode()', () => {
    it('should parse and validate valid QR code data', async () => {
      const QRCode = require('qrcode');
      await generateBookingQRCode('booking123');

      const call = QRCode.toDataURL.mock.calls[0];
      const qrCodeData = call[0];

      const result = parseAndValidateQRCode(qrCodeData);

      expect(result).not.toBeNull();
      expect(result?.bookingId).toBe('booking123');
    });

    it('should return null for invalid JSON', () => {
      const result = parseAndValidateQRCode('not valid json');

      expect(result).toBeNull();
    });

    it('should return null for missing bookingId', () => {
      const data = JSON.stringify({
        timestamp: Date.now(),
        checksum: 'somechecksum12345',
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });

    it('should return null for missing timestamp', () => {
      const data = JSON.stringify({
        bookingId: 'booking123',
        checksum: 'somechecksum12345',
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });

    it('should return null for missing checksum', () => {
      const data = JSON.stringify({
        bookingId: 'booking123',
        timestamp: Date.now(),
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });

    it('should return null for invalid bookingId type', () => {
      const data = JSON.stringify({
        bookingId: 12345,
        timestamp: Date.now(),
        checksum: 'somechecksum12345',
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });

    it('should return null for invalid timestamp type', () => {
      const data = JSON.stringify({
        bookingId: 'booking123',
        timestamp: 'not a number',
        checksum: 'somechecksum12345',
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });

    it('should return null for invalid checksum', () => {
      const data = JSON.stringify({
        bookingId: 'booking123',
        timestamp: Date.now(),
        checksum: 'invalidchecksum1',
      });

      const result = parseAndValidateQRCode(data);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // generateBookingReference() Tests
  // ============================================
  describe('generateBookingReference()', () => {
    it('should generate a reference starting with BK-', () => {
      const reference = generateBookingReference();

      expect(reference.startsWith('BK-')).toBe(true);
    });

    it('should generate a reference of fixed length (BK- + 6 chars)', () => {
      const reference = generateBookingReference();

      // "BK-" + 6 characters = 9 total
      expect(reference.length).toBe(9);
    });

    it('should only contain alphanumeric characters after prefix', () => {
      const reference = generateBookingReference();
      const suffix = reference.substring(3); // Remove "BK-"

      expect(suffix).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate unique references', () => {
      const references = new Set<string>();

      for (let i = 0; i < 100; i++) {
        references.add(generateBookingReference());
      }

      // All 100 references should be unique
      expect(references.size).toBe(100);
    });
  });
});

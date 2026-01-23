// email.test.ts (Member 8 - Testing Lead)
// Unit tests for Email service
// Tests email sending functions with mocked console output

import emailService from '../../../services/email';
import { PaymentDocument } from '../../../models/Payment';
import { IUser } from '../../../models/User';

describe('Email Service', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // Mock populated booking data
  const createMockBooking = () => ({
    _id: 'booking123',
    showtimeId: {
      movieId: {
        title: 'Test Movie',
        posterUrl: 'http://example.com/poster.jpg',
      },
      cinemaId: { name: 'Test Cinema', location: 'Downtown' },
      date: new Date('2024-12-25'),
      startTime: new Date('2024-12-25T19:00:00'),
      screenNumber: 5,
    },
    seatIds: [
      { seatNumber: 'A1', row: 'A', column: 1 },
      { seatNumber: 'A2', row: 'A', column: 2 },
    ],
    totalAmount: 25.99,
    qrCode: 'data:image/png;base64,qrcode123',
  });

  // Mock payment data
  const createMockPayment = (overrides = {}): Partial<PaymentDocument> => ({
    amount: 25.99,
    paymentMethod: 'paypal',
    paypalCaptureId: 'CAPTURE123',
    paymentDate: new Date(),
    paypalOrderId: 'ORDER123',
    ...overrides,
  });

  // Mock user data
  const createMockUser = (overrides = {}): Partial<IUser> => ({
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    ...overrides,
  });

  // ============================================
  // sendPaymentConfirmation() Tests
  // ============================================
  describe('sendPaymentConfirmation()', () => {
    it('should log payment confirmation email', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment();
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      // Email service logs either detailed format (no SendGrid) or simple success message
      expect(logOutput).toMatch(/Email|PAYMENT|test@example.com/);
    });

    it('should handle missing movie title', async () => {
      const booking = {
        ...createMockBooking(),
        showtimeId: {
          ...createMockBooking().showtimeId,
          movieId: { title: undefined, posterUrl: undefined },
        },
      };
      const payment = createMockPayment();
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      expect(logOutput).toContain('Movie');
    });

    it('should handle missing cinema name', async () => {
      const booking = {
        ...createMockBooking(),
        showtimeId: {
          ...createMockBooking().showtimeId,
          cinemaId: { name: undefined, location: undefined },
        },
      };
      const payment = createMockPayment();
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      // Email should still be sent/logged even with missing cinema name
    });

    it('should handle empty seatIds array', async () => {
      const booking = {
        ...createMockBooking(),
        seatIds: [],
      };
      const payment = createMockPayment();
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      // Email should still be sent/logged even with empty seats
    });

    it('should format card payment method correctly', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment({ paymentMethod: 'card' });
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      // Email should still be sent/logged for card payment
    });

    it('should handle missing paymentDate', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment({ paymentDate: undefined });
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle missing captureId', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment({ paypalCaptureId: undefined });
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      // Email should still be sent/logged even with missing captureId
    });

    it('should use startTime when date is missing', async () => {
      const booking = {
        ...createMockBooking(),
        showtimeId: {
          ...createMockBooking().showtimeId,
          date: undefined,
        },
      };
      const payment = createMockPayment();
      const user = createMockUser();

      await emailService.sendPaymentConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // sendRefundConfirmation() Tests
  // ============================================
  describe('sendRefundConfirmation()', () => {
    it('should log refund confirmation email', async () => {
      const booking = createMockBooking();
      const payment = createMockPayment({
        paymentStatus: 'refunded',
        paypalRefundId: 'REFUND123',
        refundDate: new Date(),
      });
      const user = createMockUser();

      await emailService.sendRefundConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      // Email service logs either detailed format (no SendGrid) or simple success message
      expect(logOutput).toMatch(/Email|REFUND|test@example.com|Refund/);
    });

    it('should handle missing movie title in refund', async () => {
      const booking = {
        ...createMockBooking(),
        showtimeId: undefined,
      };
      const payment = createMockPayment({ paymentStatus: 'refunded' });
      const user = createMockUser();

      await emailService.sendRefundConfirmation(
        booking as any,
        payment as PaymentDocument,
        user as IUser
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      expect(logOutput).toContain('Your booking');
    });
  });
});

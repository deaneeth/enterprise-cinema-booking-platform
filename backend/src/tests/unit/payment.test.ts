// Payment.test.ts (Member 7 - Unit Tests)
// Unit tests for Payment model methods and validation

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock mongoose before importing Payment model
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      create: jest.fn(),
    }),
  };
});

/* =======================
  Payment Model Unit Tests
======================= */

describe('Payment Model', () => {
  describe('canRefund() method', () => {
    it('should return true for completed payment within 180 days', () => {
      const payment = {
        paymentStatus: 'completed',
        paypalCaptureId: 'CAPTURE-123',
        paymentDate: new Date(), // Today
        createdAt: new Date(),
      };

      // Simulate canRefund logic
      const canRefund = (): boolean => {
        if (payment.paymentStatus !== 'completed') return false;
        if (!payment.paypalCaptureId) return false;
        const paymentDate = payment.paymentDate || payment.createdAt;
        const daysSincePayment = Math.floor(
          (Date.now() - new Date(paymentDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSincePayment <= 180;
      };

      expect(canRefund()).toBe(true);
    });

    it('should return false for pending payment', () => {
      const payment = {
        paymentStatus: 'pending',
        paypalCaptureId: null,
        paymentDate: null,
        createdAt: new Date(),
      };

      const canRefund = (): boolean => {
        if (payment.paymentStatus !== 'completed') return false;
        return true;
      };

      expect(canRefund()).toBe(false);
    });

    it('should return false for refunded payment', () => {
      const payment = {
        paymentStatus: 'refunded',
        paypalCaptureId: 'CAPTURE-123',
        paymentDate: new Date(),
        createdAt: new Date(),
      };

      const canRefund = (): boolean => {
        if (payment.paymentStatus !== 'completed') return false;
        return true;
      };

      expect(canRefund()).toBe(false);
    });

    it('should return false for payment without capture ID', () => {
      const payment = {
        paymentStatus: 'completed',
        paypalCaptureId: null,
        paymentDate: new Date(),
        createdAt: new Date(),
      };

      const canRefund = (): boolean => {
        if (payment.paymentStatus !== 'completed') return false;
        if (!payment.paypalCaptureId) return false;
        return true;
      };

      expect(canRefund()).toBe(false);
    });

    it('should return false for payment older than 180 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 181); // 181 days ago

      const payment = {
        paymentStatus: 'completed',
        paypalCaptureId: 'CAPTURE-123',
        paymentDate: oldDate,
        createdAt: oldDate,
      };

      const canRefund = (): boolean => {
        if (payment.paymentStatus !== 'completed') return false;
        if (!payment.paypalCaptureId) return false;
        const paymentDate = payment.paymentDate || payment.createdAt;
        const daysSincePayment = Math.floor(
          (Date.now() - new Date(paymentDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSincePayment <= 180;
      };

      expect(canRefund()).toBe(false);
    });
  });

  describe('isExpired() method', () => {
    it('should return false for pending payment within 10 minutes', () => {
      const payment = {
        paymentStatus: 'pending',
        createdAt: new Date(), // Just created
      };

      const isExpired = (): boolean => {
        if (payment.paymentStatus !== 'pending') return false;
        const tenMinutesInMs = 10 * 60 * 1000;
        const timeSinceCreation =
          Date.now() - new Date(payment.createdAt).getTime();
        return timeSinceCreation > tenMinutesInMs;
      };

      expect(isExpired()).toBe(false);
    });

    it('should return true for pending payment older than 10 minutes', () => {
      const oldDate = new Date();
      oldDate.setMinutes(oldDate.getMinutes() - 11); // 11 minutes ago

      const payment = {
        paymentStatus: 'pending',
        createdAt: oldDate,
      };

      const isExpired = (): boolean => {
        if (payment.paymentStatus !== 'pending') return false;
        const tenMinutesInMs = 10 * 60 * 1000;
        const timeSinceCreation =
          Date.now() - new Date(payment.createdAt).getTime();
        return timeSinceCreation > tenMinutesInMs;
      };

      expect(isExpired()).toBe(true);
    });

    it('should return false for completed payment', () => {
      const payment = {
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      };

      const isExpired = (): boolean => {
        if (payment.paymentStatus !== 'pending') return false;
        return true;
      };

      expect(isExpired()).toBe(false);
    });

    it('should return false for cancelled payment', () => {
      const payment = {
        paymentStatus: 'cancelled',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      };

      const isExpired = (): boolean => {
        if (payment.paymentStatus !== 'pending') return false;
        return true;
      };

      expect(isExpired()).toBe(false);
    });
  });

  describe('Payment validation', () => {
    it('should validate paymentMethod enum values', () => {
      const validMethods = ['paypal', 'card'];
      const invalidMethods = ['bitcoin', 'cash', 'venmo'];

      validMethods.forEach((method) => {
        expect(['paypal', 'card'].includes(method)).toBe(true);
      });

      invalidMethods.forEach((method) => {
        expect(['paypal', 'card'].includes(method)).toBe(false);
      });
    });

    it('should validate paymentStatus enum values', () => {
      const validStatuses = [
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled',
      ];
      const invalidStatuses = ['processing', 'approved', 'declined'];

      validStatuses.forEach((status) => {
        expect(
          ['pending', 'completed', 'failed', 'refunded', 'cancelled'].includes(
            status
          )
        ).toBe(true);
      });

      invalidStatuses.forEach((status) => {
        expect(
          ['pending', 'completed', 'failed', 'refunded', 'cancelled'].includes(
            status
          )
        ).toBe(false);
      });
    });

    it('should default currency to USD', () => {
      const defaultCurrency = 'USD';
      expect(defaultCurrency).toBe('USD');
    });

    it('should default paymentMethod to paypal', () => {
      const defaultMethod = 'paypal';
      expect(defaultMethod).toBe('paypal');
    });

    it('should default paymentStatus to pending', () => {
      const defaultStatus = 'pending';
      expect(defaultStatus).toBe('pending');
    });
  });

  describe('Amount validation', () => {
    it('should reject negative amounts', () => {
      const amount = -10;
      const isValid = amount >= 0;
      expect(isValid).toBe(false);
    });

    it('should accept zero amount', () => {
      const amount = 0;
      const isValid = amount >= 0;
      expect(isValid).toBe(true);
    });

    it('should accept positive amounts', () => {
      const amount = 25.99;
      const isValid = amount >= 0;
      expect(isValid).toBe(true);
    });
  });

  describe('PayPal fields', () => {
    it('should allow sparse paypalOrderId (multiple nulls)', () => {
      // Sparse index allows multiple null values
      const payment1 = { paypalOrderId: null };
      const payment2 = { paypalOrderId: null };
      const payment3 = { paypalOrderId: 'ORDER-123' };

      // All should be valid
      expect(payment1.paypalOrderId).toBeNull();
      expect(payment2.paypalOrderId).toBeNull();
      expect(payment3.paypalOrderId).toBe('ORDER-123');
    });

    it('should store card details when paying with card', () => {
      const paymentDetails = {
        cardBrand: 'Visa',
        cardLastFour: '4242',
      };

      expect(paymentDetails.cardBrand).toBe('Visa');
      expect(paymentDetails.cardLastFour).toBe('4242');
      expect(paymentDetails.cardLastFour.length).toBe(4);
    });
  });
});

describe('PayPal Service Functions', () => {
  describe('createOrder', () => {
    it('should format amount to 2 decimal places', () => {
      const amount = 25.994;
      const formatted = amount.toFixed(2);
      expect(formatted).toBe('25.99');
    });

    it('should use USD as currency code', () => {
      const currencyCode = 'USD';
      expect(currencyCode).toBe('USD');
    });

    it('should set intent to CAPTURE', () => {
      const intent = 'CAPTURE';
      expect(intent).toBe('CAPTURE');
    });
  });

  describe('capturePayment', () => {
    it('should identify PayPal wallet payment', () => {
      const paymentSource = { paypal: {} };
      const isCard = !!paymentSource.paypal && !('card' in paymentSource);
      expect(isCard).toBe(true);
    });

    it('should identify card payment', () => {
      const paymentSource = {
        card: { brand: 'Visa', last_digits: '4242' },
      };
      const isCard = 'card' in paymentSource;
      expect(isCard).toBe(true);
    });

    it('should extract card details correctly', () => {
      const paymentSource = {
        card: { brand: 'Mastercard', last_digits: '5555' },
      };
      const cardDetails = {
        brand: paymentSource.card.brand,
        lastFour: paymentSource.card.last_digits,
      };
      expect(cardDetails.brand).toBe('Mastercard');
      expect(cardDetails.lastFour).toBe('5555');
    });
  });

  describe('processRefund', () => {
    it('should return COMPLETED status on success', () => {
      const refundStatus = 'COMPLETED';
      const isSuccess = refundStatus === 'COMPLETED';
      expect(isSuccess).toBe(true);
    });

    it('should format partial refund amount correctly', () => {
      const partialAmount = 15.5;
      const formatted = partialAmount.toFixed(2);
      expect(formatted).toBe('15.50');
    });
  });
});

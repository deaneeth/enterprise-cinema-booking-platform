// payment.model.test.ts (Member 8 - Testing Lead)
// Unit tests for Payment model
// Tests schema validation, instance methods, static methods, and middleware

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Payment, { PaymentDocument } from '../../../models/Payment';

let mongoServer: MongoMemoryServer;

// Test data
const validPaymentData = {
  bookingId: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(),
  amount: 25.99,
  currency: 'USD',
  paymentMethod: 'paypal' as const,
  paymentStatus: 'pending' as const,
  paypalOrderId: 'ORDER123',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  await Payment.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Payment Model', () => {
  // ============================================
  // Schema Validation Tests
  // ============================================
  describe('Schema Validation', () => {
    it('should create a valid payment', async () => {
      const payment = new Payment(validPaymentData);
      await expect(payment.save()).resolves.toBeDefined();
      expect(payment._id).toBeDefined();
      expect(payment.amount).toBe(25.99);
    });

    it('should require bookingId', async () => {
      const payment = new Payment({
        ...validPaymentData,
        bookingId: undefined,
        paypalOrderId: 'ORDER456',
      });
      await expect(payment.validate()).rejects.toThrow(
        'Booking ID is required'
      );
    });

    it('should require userId', async () => {
      const payment = new Payment({
        ...validPaymentData,
        userId: undefined,
        paypalOrderId: 'ORDER457',
      });
      await expect(payment.validate()).rejects.toThrow('User ID is required');
    });

    it('should require amount', async () => {
      const payment = new Payment({
        ...validPaymentData,
        amount: undefined,
        paypalOrderId: 'ORDER458',
      });
      await expect(payment.validate()).rejects.toThrow('Amount is required');
    });

    it('should reject negative amount', async () => {
      const payment = new Payment({
        ...validPaymentData,
        amount: -10,
        paypalOrderId: 'ORDER459',
      });
      await expect(payment.validate()).rejects.toThrow(
        'Amount cannot be negative'
      );
    });

    it('should accept zero amount', async () => {
      const payment = new Payment({
        ...validPaymentData,
        amount: 0,
        paypalOrderId: 'ORDER460',
      });
      await expect(payment.validate()).resolves.toBeUndefined();
    });

    it('should default currency to USD', async () => {
      const payment = new Payment({
        ...validPaymentData,
        currency: undefined,
        paypalOrderId: 'ORDER461',
      });
      await payment.save();
      expect(payment.currency).toBe('USD');
    });

    it('should uppercase currency', async () => {
      const payment = new Payment({
        ...validPaymentData,
        currency: 'eur',
        paypalOrderId: 'ORDER462',
      });
      await payment.save();
      expect(payment.currency).toBe('EUR');
    });

    it('should default paymentMethod to paypal', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentMethod: undefined,
        paypalOrderId: 'ORDER463',
      });
      await payment.save();
      expect(payment.paymentMethod).toBe('paypal');
    });

    it('should reject invalid paymentMethod', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentMethod: 'bitcoin',
        paypalOrderId: 'ORDER464',
      } as any);
      await expect(payment.validate()).rejects.toThrow(
        'Payment method must be paypal or card'
      );
    });

    it('should accept card paymentMethod', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentMethod: 'card',
        paypalOrderId: 'ORDER465',
      });
      await expect(payment.validate()).resolves.toBeUndefined();
    });

    it('should default paymentStatus to pending', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentStatus: undefined,
        paypalOrderId: 'ORDER466',
      });
      await payment.save();
      expect(payment.paymentStatus).toBe('pending');
    });

    it('should reject invalid paymentStatus', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentStatus: 'invalid',
        paypalOrderId: 'ORDER467',
      } as any);
      await expect(payment.validate()).rejects.toThrow();
    });

    it('should accept all valid paymentStatus values', async () => {
      const statuses = [
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled',
      ];

      for (let i = 0; i < statuses.length; i++) {
        const payment = new Payment({
          ...validPaymentData,
          bookingId: new mongoose.Types.ObjectId(),
          paymentStatus: statuses[i],
          paypalOrderId: `ORDER-STATUS-${i}`,
        });
        await expect(payment.validate()).resolves.toBeUndefined();
      }
    });

    it('should lowercase payerEmail', async () => {
      const payment = new Payment({
        ...validPaymentData,
        payerEmail: 'TEST@EXAMPLE.COM',
        paypalOrderId: 'ORDER468',
      });
      await payment.save();
      expect(payment.payerEmail).toBe('test@example.com');
    });

    it('should trim payerName', async () => {
      const payment = new Payment({
        ...validPaymentData,
        payerName: '  John Doe  ',
        paypalOrderId: 'ORDER469',
      });
      await payment.save();
      expect(payment.payerName).toBe('John Doe');
    });

    it('should accept paymentDetails', async () => {
      const payment = new Payment({
        ...validPaymentData,
        paymentDetails: {
          cardBrand: 'Visa',
          cardLastFour: '1234',
        },
        paypalOrderId: 'ORDER470',
      });
      await payment.save();
      expect(payment.paymentDetails?.cardBrand).toBe('Visa');
      expect(payment.paymentDetails?.cardLastFour).toBe('1234');
    });
  });

  // ============================================
  // Instance Method Tests
  // ============================================
  describe('Instance Methods', () => {
    describe('canRefund()', () => {
      it('should return false for pending payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'pending',
          paypalOrderId: 'REFUND-TEST-1',
        });

        expect(payment.canRefund()).toBe(false);
      });

      it('should return false for completed payment without captureId', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'completed',
          paypalOrderId: 'REFUND-TEST-2',
        });

        expect(payment.canRefund()).toBe(false);
      });

      it('should return true for completed payment with captureId', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'completed',
          paypalCaptureId: 'CAPTURE123',
          paypalOrderId: 'REFUND-TEST-3',
        });

        expect(payment.canRefund()).toBe(true);
      });

      it('should return false for already refunded payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'refunded',
          paypalCaptureId: 'CAPTURE123',
          paypalOrderId: 'REFUND-TEST-4',
        });

        expect(payment.canRefund()).toBe(false);
      });

      it('should return false for failed payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'failed',
          paypalOrderId: 'REFUND-TEST-5',
        });

        expect(payment.canRefund()).toBe(false);
      });
    });

    describe('isExpired()', () => {
      it('should return false for completed payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'completed',
          paypalOrderId: 'EXPIRED-TEST-1',
        });

        expect(payment.isExpired()).toBe(false);
      });

      it('should return false for recently created pending payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'pending',
          paypalOrderId: 'EXPIRED-TEST-2',
        });

        expect(payment.isExpired()).toBe(false);
      });

      it('should return true for old pending payment', async () => {
        // Create payment first
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'pending',
          paypalOrderId: 'EXPIRED-TEST-3',
        });

        // Use MongoDB collection directly to bypass Mongoose timestamps
        await Payment.collection.updateOne(
          { _id: payment._id },
          { $set: { createdAt: new Date(Date.now() - 15 * 60 * 1000) } }
        );

        // Re-fetch the payment to get the updated createdAt
        const updatedPayment = await Payment.findById(payment._id);

        expect(updatedPayment!.isExpired()).toBe(true);
      });

      it('should return false for refunded payment', async () => {
        const payment = await Payment.create({
          ...validPaymentData,
          paymentStatus: 'refunded',
          paypalOrderId: 'EXPIRED-TEST-4',
        });

        expect(payment.isExpired()).toBe(false);
      });
    });
  });

  // ============================================
  // Static Method Tests
  // ============================================
  describe('Static Methods', () => {
    describe('findByPayPalOrderId()', () => {
      it('should find payment by PayPal order ID', async () => {
        await Payment.create({
          ...validPaymentData,
          paypalOrderId: 'FIND-ORDER-123',
        });

        const found = await Payment.findByPayPalOrderId('FIND-ORDER-123');

        expect(found).toBeDefined();
        expect(found?.paypalOrderId).toBe('FIND-ORDER-123');
      });

      it('should return null for non-existent order ID', async () => {
        const found = await Payment.findByPayPalOrderId('NONEXISTENT');

        expect(found).toBeNull();
      });
    });
  });

  // ============================================
  // Pre-save Middleware Tests
  // ============================================
  describe('Pre-save Middleware', () => {
    it('should set paymentDate when status changes to completed', async () => {
      const payment = await Payment.create({
        ...validPaymentData,
        paypalOrderId: 'MIDDLEWARE-TEST-1',
      });

      expect(payment.paymentDate).toBeUndefined();

      payment.paymentStatus = 'completed';
      await payment.save();

      expect(payment.paymentDate).toBeDefined();
      expect(payment.paymentDate).toBeInstanceOf(Date);
    });

    it('should set refundDate when status changes to refunded', async () => {
      const payment = await Payment.create({
        ...validPaymentData,
        paymentStatus: 'completed',
        paypalOrderId: 'MIDDLEWARE-TEST-2',
      });

      payment.paymentStatus = 'refunded';
      await payment.save();

      expect(payment.refundDate).toBeDefined();
      expect(payment.refundDate).toBeInstanceOf(Date);
    });

    it('should not override existing paymentDate', async () => {
      const originalDate = new Date('2024-01-01');
      const payment = await Payment.create({
        ...validPaymentData,
        paymentDate: originalDate,
        paymentStatus: 'pending',
        paypalOrderId: 'MIDDLEWARE-TEST-3',
      });

      payment.paymentStatus = 'completed';
      await payment.save();

      expect(payment.paymentDate?.getTime()).toBe(originalDate.getTime());
    });
  });

  // ============================================
  // Unique Constraints Tests
  // ============================================
  describe('Unique Constraints', () => {
    it('should enforce unique bookingId', async () => {
      const bookingId = new mongoose.Types.ObjectId();

      await Payment.create({
        ...validPaymentData,
        bookingId,
        paypalOrderId: 'UNIQUE-TEST-1',
      });

      const duplicate = new Payment({
        ...validPaymentData,
        bookingId,
        paypalOrderId: 'UNIQUE-TEST-2',
      });

      await expect(duplicate.save()).rejects.toThrow();
    });

    it('should enforce unique paypalOrderId', async () => {
      await Payment.create({
        ...validPaymentData,
        paypalOrderId: 'DUPLICATE-ORDER',
      });

      const duplicate = new Payment({
        ...validPaymentData,
        bookingId: new mongoose.Types.ObjectId(),
        paypalOrderId: 'DUPLICATE-ORDER',
      });

      await expect(duplicate.save()).rejects.toThrow();
    });

    it('should allow multiple null paypalOrderId (sparse)', async () => {
      const payment1 = await Payment.create({
        ...validPaymentData,
        paypalOrderId: undefined,
      });

      const payment2 = await Payment.create({
        ...validPaymentData,
        bookingId: new mongoose.Types.ObjectId(),
        paypalOrderId: undefined,
      });

      expect(payment1).toBeDefined();
      expect(payment2).toBeDefined();
    });
  });

  // ============================================
  // Timestamps Tests
  // ============================================
  describe('Timestamps', () => {
    it('should have createdAt and updatedAt', async () => {
      const payment = await Payment.create({
        ...validPaymentData,
        paypalOrderId: 'TIMESTAMP-TEST',
      });

      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const payment = await Payment.create({
        ...validPaymentData,
        paypalOrderId: 'TIMESTAMP-TEST-2',
      });

      const originalUpdatedAt = payment.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      payment.amount = 30.0;
      await payment.save();

      expect(payment.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});

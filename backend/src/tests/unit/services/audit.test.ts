// audit.test.ts (Member 8 - Testing Lead)
// Unit tests for Audit service
// Tests audit logging, event tracking, and log retrieval

import auditService, {
  AuditEventType,
  AuditTrigger,
  AuditLogEntry,
} from '../../../services/audit';

describe('Audit Service', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    // Clear logs before each test
    auditService.clearLogs();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // ============================================
  // log() Tests
  // ============================================
  describe('log()', () => {
    it('should log an audit event with all fields', () => {
      auditService.log({
        event: 'HOLD_CREATED',
        bookingId: 'booking123',
        showtimeId: 'showtime123',
        seatIds: ['seat1', 'seat2'],
        userId: 'user123',
        trigger: 'user_action',
        metadata: { source: 'web' },
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logOutput = consoleSpy.mock.calls[0][0];
      expect(logOutput).toContain('[AUDIT]');
      expect(logOutput).toContain('[HOLD_CREATED]');
      expect(logOutput).toContain('booking=booking123');
      expect(logOutput).toContain('showtime=showtime123');
      expect(logOutput).toContain('seats=[seat1,seat2]');
      expect(logOutput).toContain('user=user123');
      expect(logOutput).toContain('trigger=user_action');
    });

    it('should add timestamp automatically', () => {
      auditService.log({
        event: 'PAYMENT_CREATED',
        trigger: 'payment_gate_create',
      });

      const logs = auditService.getRecentLogs(1);
      expect(logs[0].timestamp).toBeDefined();
      expect(new Date(logs[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should store log in memory', () => {
      auditService.log({
        event: 'BOOKING_CONFIRMED',
        bookingId: 'booking456',
        trigger: 'user_action',
      });

      const logs = auditService.getRecentLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0].event).toBe('BOOKING_CONFIRMED');
      expect(logs[0].bookingId).toBe('booking456');
    });

    it('should handle log without optional fields', () => {
      auditService.log({
        event: 'HOLD_EXPIRED',
        trigger: 'cleanup_job',
      });

      expect(consoleSpy).toHaveBeenCalled();
      const logs = auditService.getRecentLogs(1);
      expect(logs[0].bookingId).toBeUndefined();
      expect(logs[0].seatIds).toBeUndefined();
    });

    it('should handle payment event', () => {
      auditService.log({
        event: 'PAYMENT_CAPTURED',
        bookingId: 'booking789',
        paymentId: 'payment123',
        trigger: 'payment_gate_capture',
      });

      const logs = auditService.getRecentLogs(1);
      expect(logs[0].paymentId).toBe('payment123');
    });
  });

  // ============================================
  // getRecentLogs() Tests
  // ============================================
  describe('getRecentLogs()', () => {
    it('should return empty array when no logs', () => {
      const logs = auditService.getRecentLogs();
      expect(logs).toEqual([]);
    });

    it('should return all logs when limit exceeds count', () => {
      auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });
      auditService.log({
        event: 'PAYMENT_CREATED',
        trigger: 'payment_gate_create',
      });

      const logs = auditService.getRecentLogs(100);
      expect(logs.length).toBe(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });
      }

      const logs = auditService.getRecentLogs(5);
      expect(logs.length).toBe(5);
    });

    it('should return most recent logs', () => {
      auditService.log({
        event: 'HOLD_CREATED',
        trigger: 'user_action',
        bookingId: 'first',
      });
      auditService.log({
        event: 'PAYMENT_CREATED',
        trigger: 'user_action',
        bookingId: 'second',
      });
      auditService.log({
        event: 'BOOKING_CONFIRMED',
        trigger: 'user_action',
        bookingId: 'third',
      });

      const logs = auditService.getRecentLogs(2);
      expect(logs.length).toBe(2);
      expect(logs[0].bookingId).toBe('second');
      expect(logs[1].bookingId).toBe('third');
    });

    it('should use default limit of 100', () => {
      for (let i = 0; i < 150; i++) {
        auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });
      }

      const logs = auditService.getRecentLogs();
      expect(logs.length).toBe(100);
    });
  });

  // ============================================
  // getLogsByBooking() Tests
  // ============================================
  describe('getLogsByBooking()', () => {
    it('should filter logs by booking ID', () => {
      auditService.log({
        event: 'HOLD_CREATED',
        bookingId: 'booking1',
        trigger: 'user_action',
      });
      auditService.log({
        event: 'PAYMENT_CREATED',
        bookingId: 'booking2',
        trigger: 'user_action',
      });
      auditService.log({
        event: 'PAYMENT_CAPTURED',
        bookingId: 'booking1',
        trigger: 'user_action',
      });

      const logs = auditService.getLogsByBooking('booking1');
      expect(logs.length).toBe(2);
      expect(logs.every((log) => log.bookingId === 'booking1')).toBe(true);
    });

    it('should return empty array for non-existent booking', () => {
      auditService.log({
        event: 'HOLD_CREATED',
        bookingId: 'booking1',
        trigger: 'user_action',
      });

      const logs = auditService.getLogsByBooking('nonexistent');
      expect(logs).toEqual([]);
    });
  });

  // ============================================
  // getLogsByEvent() Tests
  // ============================================
  describe('getLogsByEvent()', () => {
    it('should filter logs by event type', () => {
      auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });
      auditService.log({ event: 'PAYMENT_CREATED', trigger: 'user_action' });
      auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });

      const logs = auditService.getLogsByEvent('HOLD_CREATED');
      expect(logs.length).toBe(2);
      expect(logs.every((log) => log.event === 'HOLD_CREATED')).toBe(true);
    });

    it('should return empty array for non-existent event type', () => {
      auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });

      const logs = auditService.getLogsByEvent('PAYMENT_FAILED');
      expect(logs).toEqual([]);
    });
  });

  // ============================================
  // clearLogs() Tests
  // ============================================
  describe('clearLogs()', () => {
    it('should clear all logs', () => {
      auditService.log({ event: 'HOLD_CREATED', trigger: 'user_action' });
      auditService.log({ event: 'PAYMENT_CREATED', trigger: 'user_action' });

      auditService.clearLogs();

      const logs = auditService.getRecentLogs();
      expect(logs).toEqual([]);
    });
  });

  // ============================================
  // Convenience Methods Tests
  // ============================================
  describe('Convenience Methods', () => {
    describe('logHoldCreated()', () => {
      it('should log hold creation with all params', () => {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        auditService.logHoldCreated({
          bookingId: 'booking123',
          showtimeId: 'showtime123',
          seatIds: ['seat1', 'seat2'],
          userId: 'user123',
          expiresAt,
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('HOLD_CREATED');
        expect(logs[0].bookingId).toBe('booking123');
        expect(logs[0].showtimeId).toBe('showtime123');
        expect(logs[0].seatIds).toEqual(['seat1', 'seat2']);
        expect(logs[0].userId).toBe('user123');
      });
    });

    describe('logHoldExpired()', () => {
      it('should log hold expiration', () => {
        auditService.logHoldExpired({
          bookingId: 'booking123',
          showtimeId: 'showtime123',
          seatIds: ['seat1'],
          trigger: 'cleanup_job',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('HOLD_EXPIRED');
        expect(logs[0].trigger).toBe('cleanup_job');
      });
    });

    describe('logPaymentCreated()', () => {
      it('should log payment creation', () => {
        auditService.logPaymentCreated({
          bookingId: 'booking123',
          paymentId: 'payment123',
          userId: 'user123',
          amount: 25.99,
          orderId: 'ORDER123',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('PAYMENT_CREATED');
        expect(logs[0].paymentId).toBe('payment123');
      });
    });

    describe('logPaymentCaptured()', () => {
      it('should log payment capture', () => {
        auditService.logPaymentCaptured({
          bookingId: 'booking123',
          paymentId: 'payment123',
          userId: 'user123',
          amount: 25.99,
          captureId: 'CAPTURE123',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('PAYMENT_CAPTURED');
      });
    });

    describe('logPaymentFailed()', () => {
      it('should log payment failure', () => {
        auditService.logPaymentFailed({
          bookingId: 'booking123',
          paymentId: 'payment123',
          userId: 'user123',
          reason: 'Insufficient funds',
          trigger: 'payment_gate_capture',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('PAYMENT_FAILED');
        expect(logs[0].metadata?.reason).toBe('Insufficient funds');
      });
    });

    describe('logBookingConfirmed()', () => {
      it('should log booking confirmation', () => {
        auditService.logBookingConfirmed({
          bookingId: 'booking123',
          showtimeId: 'showtime123',
          seatIds: ['seat1', 'seat2'],
          userId: 'user123',
          paymentId: 'payment123',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('BOOKING_CONFIRMED');
      });
    });

    describe('logBookingCancelled()', () => {
      it('should log booking cancellation', () => {
        auditService.logBookingCancelled({
          bookingId: 'booking123',
          showtimeId: 'showtime123',
          seatIds: ['seat1', 'seat2'],
          userId: 'user123',
          trigger: 'user_action',
        });

        const logs = auditService.getRecentLogs(1);
        expect(logs[0].event).toBe('BOOKING_CANCELLED');
      });
    });
  });
});

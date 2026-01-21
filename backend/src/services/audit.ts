// audit.ts (Member 7)
// Lightweight audit trail service for booking and payment events
// Logs events for debugging, traceability, and observability

/* =======================
  Event Types
======================= */

export type AuditEventType =
  | 'HOLD_CREATED'
  | 'SEAT_HELD'
  | 'HOLD_EXPIRED'
  | 'HOLD_CANCELLED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED';

export type AuditTrigger =
  | 'user_action'
  | 'cleanup_job'
  | 'payment_gate_create'
  | 'payment_gate_capture'
  | 'api_read'
  | 'system';

/* =======================
  Audit Log Entry Interface
======================= */

export interface AuditLogEntry {
  event: AuditEventType;
  timestamp: string;
  bookingId?: string;
  showtimeId?: string;
  seatIds?: string[];
  userId?: string;
  paymentId?: string;
  trigger: AuditTrigger;
  metadata?: Record<string, unknown>;
}

/* =======================
  Audit Service
======================= */

class AuditService {
  private logs: AuditLogEntry[] = [];
  private maxLogSize = 1000; // Keep last 1000 entries in memory

  /**
   * Log an audit event
   * Writes to console and stores in memory for potential retrieval
   */
  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Store in memory (circular buffer)
    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }

    // Log to console with structured format
    const logMessage = this.formatLogMessage(fullEntry);
    console.log(logMessage);
  }

  /**
   * Format log message for console output
   */
  private formatLogMessage(entry: AuditLogEntry): string {
    const parts = [`[AUDIT]`, `[${entry.event}]`, entry.timestamp];

    if (entry.bookingId) {
      parts.push(`booking=${entry.bookingId}`);
    }
    if (entry.showtimeId) {
      parts.push(`showtime=${entry.showtimeId}`);
    }
    if (entry.seatIds && entry.seatIds.length > 0) {
      parts.push(`seats=[${entry.seatIds.join(',')}]`);
    }
    if (entry.userId) {
      parts.push(`user=${entry.userId}`);
    }
    if (entry.paymentId) {
      parts.push(`payment=${entry.paymentId}`);
    }
    parts.push(`trigger=${entry.trigger}`);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      parts.push(`meta=${JSON.stringify(entry.metadata)}`);
    }

    return parts.join(' ');
  }

  /**
   * Get recent audit logs (for debugging/API exposure if needed)
   */
  getRecentLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs filtered by booking ID
   */
  getLogsByBooking(bookingId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.bookingId === bookingId);
  }

  /**
   * Get logs filtered by event type
   */
  getLogsByEvent(event: AuditEventType): AuditLogEntry[] {
    return this.logs.filter((log) => log.event === event);
  }

  /**
   * Clear all logs (for testing)
   */
  clearLogs(): void {
    this.logs = [];
  }

  /* =======================
    Convenience Methods
  ======================= */

  /**
   * Log a hold creation event
   */
  logHoldCreated(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    userId: string;
    expiresAt: Date;
  }): void {
    this.log({
      event: 'HOLD_CREATED',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      userId: params.userId,
      trigger: 'user_action',
      metadata: {
        expiresAt: params.expiresAt.toISOString(),
        seatCount: params.seatIds.length,
      },
    });
  }

  /**
   * Log seats being held
   */
  logSeatsHeld(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    userId: string;
  }): void {
    this.log({
      event: 'SEAT_HELD',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      userId: params.userId,
      trigger: 'user_action',
    });
  }

  /**
   * Log a hold expiration event
   */
  logHoldExpired(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    trigger: AuditTrigger;
  }): void {
    this.log({
      event: 'HOLD_EXPIRED',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      trigger: params.trigger,
    });
  }

  /**
   * Log a hold cancellation event
   */
  logHoldCancelled(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    userId?: string;
    trigger: AuditTrigger;
  }): void {
    this.log({
      event: 'HOLD_CANCELLED',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      userId: params.userId,
      trigger: params.trigger,
    });
  }

  /**
   * Log payment creation event
   */
  logPaymentCreated(params: {
    paymentId: string;
    bookingId: string;
    userId: string;
    amount: number;
    orderId: string;
  }): void {
    this.log({
      event: 'PAYMENT_CREATED',
      paymentId: params.paymentId,
      bookingId: params.bookingId,
      userId: params.userId,
      trigger: 'user_action',
      metadata: {
        amount: params.amount,
        paypalOrderId: params.orderId,
      },
    });
  }

  /**
   * Log payment capture event
   */
  logPaymentCaptured(params: {
    paymentId: string;
    bookingId: string;
    userId: string;
    amount: number;
    captureId: string;
  }): void {
    this.log({
      event: 'PAYMENT_CAPTURED',
      paymentId: params.paymentId,
      bookingId: params.bookingId,
      userId: params.userId,
      trigger: 'user_action',
      metadata: {
        amount: params.amount,
        paypalCaptureId: params.captureId,
      },
    });
  }

  /**
   * Log payment failure event
   */
  logPaymentFailed(params: {
    paymentId?: string;
    bookingId: string;
    userId: string;
    reason: string;
    trigger: AuditTrigger;
  }): void {
    this.log({
      event: 'PAYMENT_FAILED',
      paymentId: params.paymentId,
      bookingId: params.bookingId,
      userId: params.userId,
      trigger: params.trigger,
      metadata: {
        reason: params.reason,
      },
    });
  }

  /**
   * Log booking confirmation event
   */
  logBookingConfirmed(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    userId: string;
    paymentId: string;
  }): void {
    this.log({
      event: 'BOOKING_CONFIRMED',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      userId: params.userId,
      paymentId: params.paymentId,
      trigger: 'user_action',
    });
  }

  /**
   * Log booking cancellation event
   */
  logBookingCancelled(params: {
    bookingId: string;
    showtimeId: string;
    seatIds: string[];
    userId?: string;
    trigger: AuditTrigger;
  }): void {
    this.log({
      event: 'BOOKING_CANCELLED',
      bookingId: params.bookingId,
      showtimeId: params.showtimeId,
      seatIds: params.seatIds,
      userId: params.userId,
      trigger: params.trigger,
    });
  }
}

// Export singleton instance
const auditService = new AuditService();
export default auditService;

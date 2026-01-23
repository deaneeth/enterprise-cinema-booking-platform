// websocket.test.ts (Member 8 - Testing Lead)
// Unit tests for WebSocket service
// Tests connection handling, seat updates, and broadcast functions

import websocketService from '../../../services/websocket';

// Mock socket.io
const mockTo = jest.fn().mockReturnThis();
const mockEmit = jest.fn();
const mockJoin = jest.fn();
const mockLeave = jest.fn();

const mockSocket = {
  id: 'test-socket-id',
  join: mockJoin,
  leave: mockLeave,
  emit: mockEmit,
  on: jest.fn(),
};

const mockIO = {
  on: jest.fn((event: string, handler: (socket: any) => void) => {
    if (event === 'connection') {
      handler(mockSocket);
    }
  }),
  to: mockTo,
  emit: mockEmit,
};

// Mock http server
const mockServer = {
  listen: jest.fn(),
};

describe('WebSocket Service', () => {
  let consoleSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.clearAllMocks();
    mockTo.mockReturnValue({ emit: mockEmit });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // ============================================
  // Broadcast Methods Tests
  // ============================================
  describe('Broadcast Methods', () => {
    describe('broadcastSeatUpdate()', () => {
      it('should broadcast seat update to showtime room', () => {
        // Access internal io via private method workaround
        const service = websocketService as any;
        service.io = mockIO;

        websocketService.broadcastSeatUpdate('showtime123', {
          seatId: 'seat1',
          status: 'held',
          heldBy: 'user123',
        });

        expect(mockTo).toHaveBeenCalledWith('showtime:showtime123');
        expect(mockEmit).toHaveBeenCalledWith('seat:updated', {
          seatId: 'seat1',
          status: 'held',
          heldBy: 'user123',
        });
      });

      it('should broadcast available status', () => {
        const service = websocketService as any;
        service.io = mockIO;

        websocketService.broadcastSeatUpdate('showtime123', {
          seatId: 'seat1',
          status: 'available',
        });

        expect(mockEmit).toHaveBeenCalledWith('seat:updated', {
          seatId: 'seat1',
          status: 'available',
        });
      });

      it('should broadcast booked status', () => {
        const service = websocketService as any;
        service.io = mockIO;

        websocketService.broadcastSeatUpdate('showtime123', {
          seatId: 'seat1',
          status: 'booked',
        });

        expect(mockEmit).toHaveBeenCalledWith('seat:updated', {
          seatId: 'seat1',
          status: 'booked',
        });
      });
    });

    describe('broadcastSeatsRefresh()', () => {
      it('should broadcast seats refresh signal', () => {
        const service = websocketService as any;
        service.io = mockIO;

        websocketService.broadcastSeatsRefresh('showtime456');

        expect(mockTo).toHaveBeenCalledWith('showtime:showtime456');
        expect(mockEmit).toHaveBeenCalledWith('seats:refresh');
      });
    });

    describe('broadcastBookingConfirmed()', () => {
      it('should broadcast booking confirmed to showtime room', () => {
        const service = websocketService as any;
        service.io = mockIO;

        const bookingData = {
          bookingId: 'booking123',
          seatIds: ['seat1', 'seat2'],
          totalAmount: 25.99,
        };

        websocketService.broadcastBookingConfirmed('showtime123', bookingData);

        expect(mockTo).toHaveBeenCalledWith('showtime:showtime123');
        expect(mockEmit).toHaveBeenCalledWith('booking:confirmed', bookingData);
      });
    });

    describe('broadcastShowtimeUpdated()', () => {
      it('should broadcast showtime update', () => {
        const service = websocketService as any;
        service.io = mockIO;

        const showtimeData = {
          availableSeats: 50,
          status: 'selling',
        };

        websocketService.broadcastShowtimeUpdated('showtime123', showtimeData);

        expect(mockTo).toHaveBeenCalledWith('showtime:showtime123');
        expect(mockEmit).toHaveBeenCalledWith('showtime:updated', showtimeData);
      });
    });

    describe('notifyCinemaAdmin()', () => {
      it('should notify cinema admin of booking', () => {
        const service = websocketService as any;
        service.io = mockIO;

        const bookingData = {
          bookingId: 'booking123',
          customerName: 'John Doe',
        };

        websocketService.notifyCinemaAdmin('cinema456', bookingData);

        expect(mockTo).toHaveBeenCalledWith('cinema:admin:cinema456');
        expect(mockEmit).toHaveBeenCalledWith('booking:confirmed', bookingData);
      });
    });

    describe('broadcastError()', () => {
      it('should broadcast error to room', () => {
        const service = websocketService as any;
        service.io = mockIO;

        websocketService.broadcastError(
          'showtime:showtime123',
          'Booking failed'
        );

        expect(mockTo).toHaveBeenCalledWith('showtime:showtime123');
        expect(mockEmit).toHaveBeenCalledWith('error', {
          message: 'Booking failed',
        });
      });
    });
  });

  // ============================================
  // Timer Management Tests
  // ============================================
  describe('Timer Management', () => {
    describe('getActiveHoldTimersCount()', () => {
      it('should return count of active hold timers', () => {
        const count = websocketService.getActiveHoldTimersCount();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    describe('clearSeatHoldTimer()', () => {
      it('should clear seat hold timer if exists', () => {
        // This should not throw even if timer doesn't exist
        expect(() => {
          websocketService.clearSeatHoldTimer('nonexistent-seat');
        }).not.toThrow();
      });
    });
  });

  // ============================================
  // getIO() Tests
  // ============================================
  describe('getIO()', () => {
    it('should return IO instance or null', () => {
      const io = websocketService.getIO();
      // Can be null if not initialized or the mock
      expect(io === null || typeof io === 'object').toBe(true);
    });
  });

  // ============================================
  // Edge Cases Tests
  // ============================================
  describe('Edge Cases', () => {
    it('should handle broadcast when io is null', () => {
      const service = websocketService as any;
      const originalIO = service.io;
      service.io = null;

      // Should not throw
      expect(() => {
        websocketService.broadcastSeatUpdate('showtime123', {
          seatId: 'seat1',
          status: 'available',
        });
      }).not.toThrow();

      expect(() => {
        websocketService.broadcastSeatsRefresh('showtime123');
      }).not.toThrow();

      expect(() => {
        websocketService.broadcastBookingConfirmed('showtime123', {});
      }).not.toThrow();

      expect(() => {
        websocketService.notifyCinemaAdmin('cinema123', {});
      }).not.toThrow();

      service.io = originalIO;
    });
  });

  // ============================================
  // Seat Status Types Tests
  // ============================================
  describe('Seat Status Types', () => {
    it('should support available status', () => {
      const service = websocketService as any;
      service.io = mockIO;

      websocketService.broadcastSeatUpdate('showtime', {
        seatId: 'seat1',
        status: 'available',
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'seat:updated',
        expect.objectContaining({
          status: 'available',
        })
      );
    });

    it('should support held status with user info', () => {
      const service = websocketService as any;
      service.io = mockIO;

      websocketService.broadcastSeatUpdate('showtime', {
        seatId: 'seat1',
        status: 'held',
        heldBy: 'user123',
        heldUntil: new Date().toISOString(),
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'seat:updated',
        expect.objectContaining({
          status: 'held',
          heldBy: 'user123',
        })
      );
    });

    it('should support booked status', () => {
      const service = websocketService as any;
      service.io = mockIO;

      websocketService.broadcastSeatUpdate('showtime', {
        seatId: 'seat1',
        status: 'booked',
      });

      expect(mockEmit).toHaveBeenCalledWith(
        'seat:updated',
        expect.objectContaining({
          status: 'booked',
        })
      );
    });
  });
});

// websocket.ts (Member 5)
// WebSocket client service - Handles real-time communication for seat availability
// Manages WebSocket connections, listens for seat updates, and handles real-time booking notifications

import { io, Socket } from "socket.io-client";

/* =======================
  Types and Interfaces
======================= */

/**
 * Data for holding/releasing a seat
 */
export interface SeatHoldData {
  showtimeId: string;
  seatId: string;
  userId: string;
}

/**
 * Seat update payload from server
 */
export interface SeatUpdateData {
  seatId: string;
  status: "available" | "held" | "booked";
  heldBy?: string;
}

/**
 * Booking confirmation data from server
 */
export interface BookingConfirmedData {
  bookingId: string;
  numberOfSeats: number;
}

/**
 * Showtime update data from server
 */
export interface ShowtimeUpdatedData {
  availableSeats: number;
  [key: string]: unknown;
}

/**
 * Error data from server
 */
export interface WebSocketError {
  message: string;
}

/**
 * Booking data for notifications
 */
export interface BookingNotificationData {
  showtimeId: string;
  cinemaId: string;
  bookingData: {
    bookingId: string;
    userId: string;
    seatIds: string[];
    totalAmount: number;
    [key: string]: unknown;
  };
}

/* =======================
  WebSocket Client Class
======================= */

/**
 * WebSocket client service for real-time seat availability and booking updates.
 * Implements singleton pattern for global access.
 */
class WebSocketClient {
  private socket: Socket | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Get WebSocket server URL from environment or default to localhost
   */
  private getServerUrl(): string {
    return (
      process.env.REACT_APP_WEBSOCKET_URL ||
      process.env.REACT_APP_API_URL ||
      "http://localhost:5000"
    );
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    const serverUrl = this.getServerUrl();

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection event handlers
    this.socket.on("connect", () => {
      console.log("WebSocket connected:", this.socket?.id);
      this.connectionAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      this.connectionAttempts++;
      console.error(
        `WebSocket connection error (attempt ${this.connectionAttempts}):`,
        error.message
      );

      if (this.connectionAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnection error:", error.message);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("WebSocket client disconnected");
    }
  }

  /**
   * Check if the socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get the socket ID (for debugging)
   */
  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  // ========== EMIT EVENTS (Client → Server) ==========

  /**
   * Join a showtime room to receive seat updates
   * @param showtimeId - The showtime ID to join
   */
  joinShowtime(showtimeId: string): void {
    if (!showtimeId) {
      console.warn("Cannot join showtime: showtimeId is required");
      return;
    }
    this.socket?.emit("join:showtime", showtimeId);
    console.log("Joined showtime room:", showtimeId);
  }

  /**
   * Leave a showtime room
   * @param showtimeId - The showtime ID to leave
   */
  leaveShowtime(showtimeId: string): void {
    if (!showtimeId) return;
    this.socket?.emit("leave:showtime", showtimeId);
    console.log("Left showtime room:", showtimeId);
  }

  /**
   * Join cinema admin room for booking notifications
   * @param cinemaId - The cinema ID to join as admin
   */
  joinCinemaAdmin(cinemaId: string): void {
    if (!cinemaId) {
      console.warn("Cannot join cinema admin room: cinemaId is required");
      return;
    }
    this.socket?.emit("join:cinema:admin", cinemaId);
    console.log("Joined cinema admin room:", cinemaId);
  }

  /**
   * Hold a seat (10-minute temporary hold)
   * @param showtimeId - The showtime ID
   * @param seatId - The seat ID to hold
   * @param userId - The user ID holding the seat
   */
  holdSeat(showtimeId: string, seatId: string, userId: string): void {
    if (!showtimeId || !seatId || !userId) {
      console.warn("Cannot hold seat: all parameters are required");
      return;
    }
    this.socket?.emit("seat:hold", { showtimeId, seatId, userId });
    console.log("Seat hold requested:", { showtimeId, seatId, userId });
  }

  /**
   * Release a held seat
   * @param showtimeId - The showtime ID
   * @param seatId - The seat ID to release
   */
  releaseSeat(showtimeId: string, seatId: string): void {
    if (!showtimeId || !seatId) {
      console.warn("Cannot release seat: showtimeId and seatId are required");
      return;
    }
    this.socket?.emit("seat:release", { showtimeId, seatId });
    console.log("Seat release requested:", { showtimeId, seatId });
  }

  /**
   * Notify of booking creation (for cinema admin notifications)
   * @param data - Booking notification data
   */
  notifyBookingCreated(data: BookingNotificationData): void {
    if (!data.showtimeId || !data.cinemaId) {
      console.warn(
        "Cannot notify booking: showtimeId and cinemaId are required"
      );
      return;
    }
    this.socket?.emit("booking:create", data);
    console.log("Booking creation notified:", data.bookingData?.bookingId);
  }

  /**
   * Notify of booking cancellation
   * @param showtimeId - The showtime ID
   * @param seatIds - Array of seat IDs to release
   */
  notifyBookingCancelled(showtimeId: string, seatIds: string[]): void {
    if (!showtimeId || !seatIds?.length) {
      console.warn(
        "Cannot notify cancellation: showtimeId and seatIds are required"
      );
      return;
    }
    this.socket?.emit("booking:cancel", { showtimeId, seatIds });
    console.log("Booking cancellation notified:", { showtimeId, seatIds });
  }

  // ========== LISTEN EVENTS (Server → Client) ==========

  /**
   * Listen for single seat update
   * @param callback - Function to call when seat is updated
   */
  onSeatUpdated(callback: (data: SeatUpdateData) => void): void {
    this.socket?.on("seat:updated", callback);
  }

  /**
   * Listen for seats refresh trigger (refetch all seats)
   * @param callback - Function to call when seats should be refreshed
   */
  onSeatsRefresh(callback: () => void): void {
    this.socket?.on("seats:refresh", callback);
  }

  /**
   * Listen for booking confirmation
   * @param callback - Function to call when booking is confirmed
   */
  onBookingConfirmed(callback: (data: BookingConfirmedData) => void): void {
    this.socket?.on("booking:confirmed", callback);
  }

  /**
   * Listen for showtime availability updates
   * @param callback - Function to call when showtime is updated
   */
  onShowtimeUpdated(callback: (data: ShowtimeUpdatedData) => void): void {
    this.socket?.on("showtime:updated", callback);
  }

  /**
   * Listen for errors from the server
   * @param callback - Function to call when error occurs
   */
  onError(callback: (data: WebSocketError) => void): void {
    this.socket?.on("error", callback);
  }

  // ========== CLEANUP (Remove Listeners) ==========

  /**
   * Remove seat update listener
   */
  offSeatUpdated(): void {
    this.socket?.off("seat:updated");
  }

  /**
   * Remove seats refresh listener
   */
  offSeatsRefresh(): void {
    this.socket?.off("seats:refresh");
  }

  /**
   * Remove booking confirmed listener
   */
  offBookingConfirmed(): void {
    this.socket?.off("booking:confirmed");
  }

  /**
   * Remove showtime updated listener
   */
  offShowtimeUpdated(): void {
    this.socket?.off("showtime:updated");
  }

  /**
   * Remove error listener
   */
  offError(): void {
    this.socket?.off("error");
  }

  /**
   * Remove all event listeners
   * Call this in React useEffect cleanup to prevent memory leaks
   */
  removeAllListeners(): void {
    this.offSeatUpdated();
    this.offSeatsRefresh();
    this.offBookingConfirmed();
    this.offShowtimeUpdated();
    this.offError();
  }

  /**
   * Cleanup and disconnect
   * Call this when component unmounts or user logs out
   */
  cleanup(): void {
    this.removeAllListeners();
    this.disconnect();
  }
}

// Export singleton instance
const websocketClient = new WebSocketClient();
export default websocketClient;

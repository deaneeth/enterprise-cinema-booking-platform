// BookingContext.tsx (Member 5)
// Booking context - Manages booking flow state for the application
// Handles seat selection, booking creation, confirmation, and cancellation

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { bookingsApi, getErrorMessage } from "../services/api";
import websocketClient from "../services/websocket";
import { useAuth } from "./AuthContext";

/* =======================
  Types and Interfaces
======================= */

/**
 * Seat representation for selection
 */
export interface Seat {
  id: string;
  row: string;
  number: number;
  status: "available" | "held" | "booked";
  price?: number;
  type?: "standard" | "premium" | "vip";
}

/**
 * Showtime information for booking
 */
export interface Showtime {
  id: string;
  movieId: string;
  cinemaId: string;
  startTime: string;
  endTime: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  format?: string;
  language?: string;
}

/**
 * Booking representation
 */
export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  seatIds: string[];
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "expired";
  bookingDate: string;
  paymentId?: string;
  qrCode?: string;
  holdExpiresAt?: string;
  showtime?: Showtime;
  seats?: Seat[];
}

/**
 * Booking context interface
 */
interface BookingContextType {
  // State
  currentBooking: Booking | null;
  selectedSeats: Seat[];
  currentShowtime: Showtime | null;
  isLoading: boolean;
  error: string | null;
  holdExpiresAt: Date | null;

  // Seat management
  setCurrentShowtime: (showtime: Showtime | null) => void;
  addSeat: (seat: Seat) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;
  isSeatSelected: (seatId: string) => boolean;

  // Booking operations
  createBooking: (showtimeId: string, seatIds: string[]) => Promise<Booking>;
  confirmBooking: (bookingId: string, paymentId?: string) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getBooking: (bookingId: string) => Promise<Booking>;
  getMyBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<{
    bookings: Booking[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>;

  // Cleanup
  clearBooking: () => void;
  clearError: () => void;
}

// Create context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider props
interface BookingProviderProps {
  children: ReactNode;
}

/* =======================
  BookingProvider Component
======================= */

/**
 * BookingProvider component
 * Manages booking state and operations for the entire application
 */
export const BookingProvider: React.FC<BookingProviderProps> = ({
  children,
}) => {
  // State
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [currentShowtime, setCurrentShowtime] = useState<Showtime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);

  // Get auth context for user info
  const { currentUser } = useAuth();

  /* =======================
    Seat Management
  ======================= */

  /**
   * Add a seat to selection
   */
  const addSeat = useCallback(
    (seat: Seat): void => {
      if (seat.status !== "available") {
        console.warn("Cannot add seat: seat is not available");
        return;
      }

      setSelectedSeats((prev) => {
        // Check if already selected
        if (prev.some((s) => s.id === seat.id)) {
          return prev;
        }
        return [...prev, seat];
      });

      // Notify server about seat hold via WebSocket
      if (currentShowtime && currentUser) {
        websocketClient.holdSeat(currentShowtime.id, seat.id, currentUser.id);
      }
    },
    [currentShowtime, currentUser],
  );

  /**
   * Remove a seat from selection
   */
  const removeSeat = useCallback(
    (seatId: string): void => {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));

      // Notify server about seat release via WebSocket
      if (currentShowtime) {
        websocketClient.releaseSeat(currentShowtime.id, seatId);
      }
    },
    [currentShowtime],
  );

  /**
   * Clear all selected seats
   */
  const clearSeats = useCallback((): void => {
    // Release all held seats via WebSocket
    if (currentShowtime) {
      selectedSeats.forEach((seat) => {
        websocketClient.releaseSeat(currentShowtime.id, seat.id);
      });
    }
    setSelectedSeats([]);
  }, [currentShowtime, selectedSeats]);

  /**
   * Check if a seat is selected
   */
  const isSeatSelected = useCallback(
    (seatId: string): boolean => {
      return selectedSeats.some((s) => s.id === seatId);
    },
    [selectedSeats],
  );

  /* =======================
    Booking Operations
  ======================= */

  /**
   * Create a new booking
   */
  const createBooking = useCallback(
    async (showtimeId: string, seatIds: string[]): Promise<Booking> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookingsApi.create({ showtimeId, seatIds });

        if (response.data.success && response.data.data) {
          const bookingData = response.data.data as {
            booking: Booking;
            holdExpiresAt: string;
          };

          const booking = bookingData.booking;
          setCurrentBooking(booking);

          // Set hold expiration
          if (bookingData.holdExpiresAt) {
            setHoldExpiresAt(new Date(bookingData.holdExpiresAt));
          }

          return booking;
        } else {
          throw new Error("Failed to create booking");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Confirm a booking after payment
   */
  const confirmBooking = useCallback(
    async (bookingId: string, paymentId?: string): Promise<Booking> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookingsApi.confirm(bookingId, paymentId);

        if (response.data.success && response.data.data) {
          const bookingData = response.data.data as { booking: Booking };
          const booking = bookingData.booking;

          setCurrentBooking(booking);
          setHoldExpiresAt(null); // Clear hold timer on confirmation
          setSelectedSeats([]); // Clear selected seats

          return booking;
        } else {
          throw new Error("Failed to confirm booking");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(
    async (bookingId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookingsApi.cancel(bookingId);

        if (response.data.success) {
          // Clear current booking if it matches
          if (currentBooking?.id === bookingId) {
            setCurrentBooking(null);
            setHoldExpiresAt(null);
            setSelectedSeats([]);
          }
        } else {
          throw new Error("Failed to cancel booking");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentBooking],
  );

  /**
   * Get a specific booking by ID
   */
  const getBooking = useCallback(
    async (bookingId: string): Promise<Booking> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookingsApi.getById(bookingId);

        if (response.data.success && response.data.data) {
          return response.data.data as Booking;
        } else {
          throw new Error("Booking not found");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Get current user's bookings
   */
  const getMyBookings = useCallback(
    async (params?: {
      status?: string;
      page?: number;
      limit?: number;
    }): Promise<{
      bookings: Booking[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await bookingsApi.getMyBookings(params);

        if (response.data.success) {
          return {
            bookings: (response.data.data || []) as Booking[],
            pagination: response.data.pagination || {
              page: 1,
              limit: 10,
              total: 0,
              pages: 0,
            },
          };
        } else {
          throw new Error("Failed to fetch bookings");
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /* =======================
    Cleanup Methods
  ======================= */

  /**
   * Clear current booking state
   */
  const clearBooking = useCallback((): void => {
    setCurrentBooking(null);
    setHoldExpiresAt(null);
    clearSeats();
  }, [clearSeats]);

  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /* =======================
    Context Value
  ======================= */

  const value: BookingContextType = {
    // State
    currentBooking,
    selectedSeats,
    currentShowtime,
    isLoading,
    error,
    holdExpiresAt,

    // Seat management
    setCurrentShowtime,
    addSeat,
    removeSeat,
    clearSeats,
    isSeatSelected,

    // Booking operations
    createBooking,
    confirmBooking,
    cancelBooking,
    getBooking,
    getMyBookings,

    // Cleanup
    clearBooking,
    clearError,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

/* =======================
  Custom Hook
======================= */

/**
 * Custom hook to use booking context
 * @throws Error if used outside of BookingProvider
 */
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);

  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }

  return context;
};

export default BookingContext;

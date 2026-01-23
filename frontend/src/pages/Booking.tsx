// Booking.tsx (Member 5)
// Booking page - Handles the seat selection and booking creation flow
// Receives showtimeId from URL, displays showtime details, seat map, and payment flow

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { bookingsApi, getErrorMessage } from "../services/api";
import { useBooking } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import websocketClient from "../services/websocket";
import SeatMap, { SeatData } from "../components/booking/SeatMap";
import BookingSummary from "../components/booking/BookingSummary";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

/* =======================
  Types and Interfaces
======================= */

interface Movie {
  _id: string;
  title: string;
  posterUrl?: string;
  duration?: number;
  genre?: string[];
  rating?: string;
}

interface Cinema {
  _id: string;
  name: string;
  location?: {
    address?: string;
    city?: string;
  };
}

interface Showtime {
  _id: string;
  movieId: Movie;
  cinemaId: Cinema;
  startTime: string;
  endTime: string;
  date: string;
  price: number;
  format?: string;
  language?: string;
  availableSeats: number;
  totalSeats: number;
  screenNumber?: number;
}

/* =======================
  Booking Page Component
======================= */

const Booking: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    addSeat,
    removeSeat,
    clearSeats,
    setCurrentShowtime,
    createBooking,
    error: bookingError,
    clearError,
  } = useBooking();

  // Local state
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setIsCreatingBooking] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<SeatData[]>([]);
  const [holdTimeRemaining, setHoldTimeRemaining] = useState<number | null>(
    null
  );
  const [checkingExistingBooking, setCheckingExistingBooking] = useState(true);

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  /**
   * Fetch showtime details
   */
  useEffect(() => {
    if (!showtimeId) return;

    const fetchShowtime = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ success: boolean; data: Showtime }>(
          `/api/showtimes/${showtimeId}`
        );

        if (response.data.success && response.data.data) {
          const showtimeData = response.data.data;
          setShowtime(showtimeData);
          document.title = `Book Tickets - ${showtimeData.movieId?.title || "Booking"}`;

          // Set current showtime in booking context
          setCurrentShowtime({
            id: showtimeData._id,
            movieId: showtimeData.movieId._id,
            cinemaId: showtimeData.cinemaId._id,
            startTime: showtimeData.startTime,
            endTime: showtimeData.endTime,
            price: showtimeData.price,
            availableSeats: showtimeData.availableSeats,
            totalSeats: showtimeData.totalSeats,
            format: showtimeData.format,
            language: showtimeData.language,
          });
        } else {
          setError("Showtime not found");
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchShowtime();
  }, [showtimeId, setCurrentShowtime]);

  /**
   * No auto-redirect needed for existing bookings.
   * SeatMap auto-restores user's held seats on page load.
   * User can see their selection and choose to proceed to payment.
   */
  useEffect(() => {
    // Just mark as done checking - no redirect needed
    setCheckingExistingBooking(false);
  }, []);

  /**
   * Connect to WebSocket for real-time seat updates
   */
  useEffect(() => {
    if (!showtimeId) return;

    // Connect WebSocket and join showtime room
    websocketClient?.connect();
    websocketClient?.joinShowtime(showtimeId);

    return () => {
      websocketClient?.leaveShowtime(showtimeId);
    };
  }, [showtimeId]);

  /**
   * Redirect to login if not authenticated
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login", { state: { from: `/booking/${showtimeId}` } });
    }
  }, [loading, isAuthenticated, navigate, showtimeId]);

  /**
   * Handle seat selection from SeatMap
   * Clean flow: Just add to local state, seat is already held via SeatMap's API call
   * NO booking created during selection - booking only created on "Proceed to Payment"
   */
  const handleSeatSelect = useCallback(
    (seat: SeatData) => {
      // Add seat to local selection (seat is already held on backend by SeatMap)
      setSelectedSeats((prev) => {
        const isAlreadySelected = prev.some((s) => s._id === seat._id);
        if (isAlreadySelected) {
          return prev;
        }
        return [...prev, seat];
      });

      // Add to context for UI tracking
      addSeat({
        id: seat._id,
        row: seat.row,
        number: seat.column,
        status: "held",
        price: seat.price,
        type: seat.seatType === "vip" ? "premium" : "standard",
      });
    },
    [addSeat]
  );

  /**
   * Handle seat deselection from SeatMap
   * Seat is released via SeatMap's API call, just update local state here
   */
  const handleSeatDeselect = useCallback(
    (seatId: string) => {
      setSelectedSeats((prev) => prev.filter((s) => s._id !== seatId));
      removeSeat(seatId);
    },
    [removeSeat]
  );

  /**
   * Handle proceed to payment
   * Clean flow: Create ONE booking with ALL selected seats
   * This is the ONLY place a booking is created
   */
  const handleProceedToPayment = async () => {
    if (!showtimeId || selectedSeats.length === 0) return;

    try {
      setIsCreatingBooking(true);
      clearError();

      const seatIds = selectedSeats.map((seat) => seat._id);

      // Create booking with all selected seats
      console.log("[Booking] Creating booking with", seatIds.length, "seats");
      const booking = await createBooking(showtimeId, seatIds);
      const newBookingId =
        (booking as { id?: string; _id?: string }).id ||
        (booking as { id?: string; _id?: string })._id ||
        null;

      if (!newBookingId) {
        throw new Error("Failed to create booking");
      }

      // Navigate to payment page
      navigate(`/payment/${newBookingId}`, {
        state: {
          bookingId: newBookingId,
          showtime,
          totalPrice,
        },
      });
    } catch (err) {
      console.error("Failed to create booking:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create booking";
      
      // Check if error is due to existing pending booking
      if (errorMessage.includes('already have a pending booking')) {
        // Fetch existing booking and redirect
        try {
          const response = await bookingsApi.getMyBookings({ status: 'pending' });
          if (response.data.success && response.data.data) {
            const bookings = response.data.data as Array<{
              _id: string;
              showtimeId: string | { _id: string };
              expiresAt?: string;
            }>;
            const existingBooking = bookings.find((b) => {
              const bookingShowtimeId = typeof b.showtimeId === 'string' 
                ? b.showtimeId 
                : b.showtimeId?._id;
              return bookingShowtimeId === showtimeId;
            });
            if (existingBooking) {
              navigate(`/payment/${existingBooking._id}`, { replace: true });
              return;
            }
          }
        } catch {
          // If we can't find existing booking, show error
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  /**
   * Handle clear selection - release all held seats
   * No booking exists during selection phase, just release seats
   */
  const handleClearSelection = async () => {
    // Release all held seats via API
    await Promise.all(
      selectedSeats.map((seat) =>
        api.put(`/api/seats/${seat._id}/release`).catch(() => {
          // Ignore errors - seat might already be released
        })
      )
    );

    // Clear local state
    setSelectedSeats([]);
    setHoldTimeRemaining(null);
    clearSeats();
  };

  /**
   * Timer - uses seat.heldUntil (earliest expiry among selected seats)
   * Since no booking exists during selection, timer is based on seat holds
   */
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHoldTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      // Find earliest expiry among all selected seats
      const seatsWithHoldTime = selectedSeats.filter((s) => s.heldUntil);
      
      if (seatsWithHoldTime.length === 0) {
        // No heldUntil info - seats are held but timer not shown
        return;
      }

      const earliestExpiry = Math.min(
        ...seatsWithHoldTime.map((s) => new Date(s.heldUntil!).getTime())
      );

      const remaining = Math.max(0, Math.floor((earliestExpiry - Date.now()) / 1000));
      setHoldTimeRemaining(remaining);

      // If timer expired, clear selection
      if (remaining === 0) {
        setSelectedSeats([]);
        clearSeats();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [selectedSeats, clearSeats]);

  /**
   * Handle cancel and go back - release held seats first
   */
  const handleCancel = async () => {
    // Release all selected seats on the backend before leaving
    try {
      await Promise.all(
        selectedSeats.map((seat) =>
          api.put(`/api/seats/${seat._id}/release`).catch((err) => {
            console.error(`Failed to release seat ${seat.seatNumber}:`, err);
          })
        )
      );
    } catch (err) {
      console.error("Error releasing seats:", err);
    }

    clearSeats();
    // Navigate to movie detail page instead of history.back()
    if (showtime?.movieId?._id) {
      navigate(`/movies/${showtime.movieId._id}`);
    } else {
      navigate("/movies");
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Format duration for display
   */
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Loading state (including check for existing booking)
  if (loading || checkingExistingBooking) {
    return <Loading fullScreen message={checkingExistingBooking ? "Checking for existing booking..." : "Loading showtime details..."} />;
  }

  // Error state
  if (error || !showtime) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Showtime Not Found</h2>
        <p className="mt-2 text-gray-600">
          {error || "The showtime you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => navigate("/movies")}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const movie = showtime.movieId;
  const cinema = showtime.cinemaId;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <main className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Select Your Seats
          </h1>
        </div>

        {/* Error Display */}
        {bookingError && (
          <div className="mb-6">
            <ErrorMessage
              message={bookingError}
              title="Booking Error"
              type="error"
              onDismiss={clearError}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Seat Map Area */}
          <div className="lg:col-span-2">
            {/* Movie & Showtime Info Card */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
              <div className="flex gap-4">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-32 w-24 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-32 w-24 items-center justify-center rounded-md bg-gray-200 text-xs text-gray-500">
                    No Image
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {movie.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {movie.genre?.map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {g}
                      </span>
                    ))}
                    {movie.duration && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {formatDuration(movie.duration)}
                      </span>
                    )}
                    {movie.rating && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {movie.rating}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{cinema.name}</p>
                    {cinema.location?.address && (
                      <p>{cinema.location.address}</p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="font-medium text-indigo-600">
                      {formatDate(showtime.startTime)}
                    </span>
                    <span className="text-gray-600">
                      {formatTime(showtime.startTime)} -{" "}
                      {formatTime(showtime.endTime)}
                    </span>
                    {showtime.format && (
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {showtime.format}
                      </span>
                    )}
                    {showtime.language && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {showtime.language}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Map Component (Member 6) */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              {showtimeId && (
                <SeatMap
                  showtimeId={showtimeId}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  onSeatDeselect={handleSeatDeselect}
                />
              )}
            </div>
          </div>

          {/* Sidebar - Booking Summary (Member 6) */}
          <div className="lg:col-span-1">
            <BookingSummary
              selectedSeats={selectedSeats}
              showtime={showtime}
              onProceedToPayment={handleProceedToPayment}
              onClearSelection={handleClearSelection}
              onRemoveSeat={handleSeatDeselect}
              holdTimeRemaining={holdTimeRemaining}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;

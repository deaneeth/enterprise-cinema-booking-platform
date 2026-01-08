// Booking.tsx (Member 5)
// Booking page - Handles the seat selection and booking creation flow
// Receives showtimeId from URL, displays showtime details, seat map, and payment flow

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useBooking, Seat } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import websocketClient from "../services/websocket";

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
  const { currentUser, isAuthenticated } = useAuth();
  const {
    selectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    setCurrentShowtime,
    createBooking,
    isLoading: isBookingLoading,
    error: bookingError,
    clearError,
  } = useBooking();

  // Local state
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Calculate total price
  const totalPrice = selectedSeats.reduce(
    (sum, seat) => sum + (seat.price || showtime?.price || 0),
    0
  );

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
   * Connect to WebSocket for real-time seat updates
   */
  useEffect(() => {
    if (!showtimeId) return;

    // Connect WebSocket and join showtime room
    websocketClient.connect();
    websocketClient.joinShowtime(showtimeId);

    // Listen for seat updates
    websocketClient.onSeatUpdated((data) => {
      console.log("Seat updated:", data);
      // Handle seat update - this would trigger a re-render of seat map
    });

    websocketClient.onError((data) => {
      console.error("WebSocket error:", data.message);
    });

    return () => {
      websocketClient.leaveShowtime(showtimeId);
      websocketClient.removeAllListeners();
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
   * Handle seat selection toggle This function is defined but not currently called. This is intentional - it's ready for Member 6's SeatMap component integration. The SeatMap will use this callback when users click on seats.
   */
  const handleSeatClick = useCallback(
    (seat: Seat) => {
      if (seat.status !== "available") {
        return; // Cannot select held or booked seats
      }

      const isSelected = selectedSeats.some((s) => s.id === seat.id);
      if (isSelected) {
        removeSeat(seat.id);
      } else {
        addSeat(seat);
      }
    },
    [selectedSeats, addSeat, removeSeat]
  );

  /**
   * Handle proceed to payment
   */
  const handleProceedToPayment = async () => {
    if (!showtimeId || selectedSeats.length === 0) return;

    try {
      setIsCreatingBooking(true);
      clearError();

      const seatIds = selectedSeats.map((seat) => seat.id);
      const booking = await createBooking(showtimeId, seatIds);

      // Navigate to payment page with booking info
      navigate(`/payment/${booking.id}`, {
        state: {
          booking,
          showtime,
          totalPrice,
        },
      });
    } catch (err) {
      console.error("Failed to create booking:", err);
      // Error is handled by BookingContext
    } finally {
      setIsCreatingBooking(false);
    }
  };

  /**
   * Handle cancel and go back
   */
  const handleCancel = () => {
    clearSeats();
    navigate(-1);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
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
          onClick={() => navigate(-1)}
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

            {/* Seat Map Placeholder (Member 6 will create SeatMap component) */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Seat Map
              </h3>

              {/* Screen indicator */}
              <div className="mb-8 text-center">
                <div className="mx-auto h-2 w-2/3 rounded-t-full bg-gradient-to-b from-gray-400 to-transparent"></div>
                <p className="mt-1 text-xs text-gray-500">SCREEN</p>
              </div>

              {/* Placeholder for SeatMap component from Member 6 */}
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    SeatMap Component (Member 6)
                  </p>
                  <p className="text-xs text-gray-400">
                    Available Seats: {showtime.availableSeats} /{" "}
                    {showtime.totalSeats}
                  </p>
                </div>
              </div>

              {/* Seat Legend */}
              <div className="mt-6 flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gray-200 border border-gray-300"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-indigo-600"></div>
                  <span className="text-sm text-gray-600">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-yellow-400"></div>
                  <span className="text-sm text-gray-600">Held</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-gray-500"></div>
                  <span className="text-sm text-gray-600">Booked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Booking Summary
              </h3>

              {/* Selected Seats */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">
                  Selected Seats
                </p>
                {selectedSeats.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <span
                        key={seat.id}
                        className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
                      >
                        {seat.row}
                        {seat.number}
                        <button
                          onClick={() => removeSeat(seat.id)}
                          className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    No seats selected
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedSeats.length} × Ticket(s)
                  </span>
                  <span className="text-gray-900">
                    ${showtime.price.toFixed(2)} each
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Error Display */}
              {bookingError && (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleProceedToPayment}
                  disabled={
                    selectedSeats.length === 0 ||
                    isCreatingBooking ||
                    isBookingLoading
                  }
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isCreatingBooking || isBookingLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="mr-2 h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Proceed to Payment - $${totalPrice.toFixed(2)}`
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              {/* Info Note */}
              <p className="mt-4 text-xs text-gray-500">
                * Seats are held for 10 minutes. Please complete payment within
                the time limit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;

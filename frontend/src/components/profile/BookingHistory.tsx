// BookingHistory.tsx (Member 5)
// Booking history component - Displays user's booking history with grouping and cancel functionality
// Shows upcoming, past, and cancelled bookings with details and QR codes

import React, { useEffect, useState, useCallback } from "react";
import { useBooking, Booking } from "../../contexts/BookingContext";

/* =======================
  Types and Interfaces
======================= */

interface GroupedBookings {
  upcoming: Booking[];
  past: Booking[];
  cancelled: Booking[];
}

interface CancelModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

/* =======================
  Cancel Confirmation Modal
======================= */

const CancelModal: React.FC<CancelModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to cancel this booking? This action cannot be
          undone.
        </p>

        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-900">
            Booking #{booking.id.slice(-8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-600">
            {booking.numberOfSeats} seat(s) • ${booking.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =======================
  Booking Card Component
======================= */

interface BookingCardProps {
  booking: Booking;
  onCancelClick: (booking: Booking) => void;
  canCancel: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancelClick,
  canCancel,
}) => {
  const [showQR, setShowQR] = useState(false);

  // Extract showtime and movie info (handle populated data)
  const showtime = booking.showtime as any;
  const movie = showtime?.movieId || {};
  const cinema = showtime?.cinemaId || {};

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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
   * Get status badge color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Format seat labels
   */
  const formatSeats = () => {
    const seats = booking.seats || [];
    if (seats.length === 0 && booking.seatIds?.length > 0) {
      return `${booking.seatIds.length} seat(s)`;
    }
    return (
      seats.map((s) => `${s.row}${s.number}`).join(", ") ||
      `${booking.numberOfSeats} seat(s)`
    );
  };

  return (
    <div className="rounded-lg bg-white shadow-md overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Movie Poster */}
        <div className="flex-shrink-0">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title || "Movie"}
              className="h-48 w-full object-cover sm:h-full sm:w-32"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-gray-200 text-sm text-gray-500 sm:h-full sm:w-32">
              No Image
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {movie.title || "Movie Title"}
              </h3>
              <p className="text-sm text-gray-600">
                {cinema.name || "Cinema"}
                {showtime?.screenNumber && ` • Screen ${showtime.screenNumber}`}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}
            >
              {booking.bookingStatus.charAt(0).toUpperCase() +
                booking.bookingStatus.slice(1)}
            </span>
          </div>

          {/* Date and Time */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date:</span>{" "}
              <span className="font-medium text-gray-900">
                {showtime?.startTime ? formatDate(showtime.startTime) : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Time:</span>{" "}
              <span className="font-medium text-gray-900">
                {showtime?.startTime ? formatTime(showtime.startTime) : "N/A"}
              </span>
            </div>
          </div>

          {/* Seats and Amount */}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Seats:</span>{" "}
              <span className="font-medium text-gray-900">{formatSeats()}</span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>{" "}
              <span className="font-semibold text-indigo-600">
                ${booking.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Booking ID */}
          <p className="mt-2 text-xs text-gray-500">
            Booking ID: {booking.id.slice(-12).toUpperCase()}
          </p>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* QR Code Button - only for confirmed bookings */}
            {booking.bookingStatus === "confirmed" && booking.qrCode && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {showQR ? "Hide QR" : "Show QR"}
              </button>
            )}

            {/* Cancel Button - only if cancellable */}
            {canCancel && booking.bookingStatus !== "cancelled" && (
              <button
                onClick={() => onCancelClick(booking)}
                className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Cancel Booking
              </button>
            )}
          </div>

          {/* QR Code Display */}
          {showQR && booking.qrCode && (
            <div className="mt-4 flex flex-col items-center rounded-lg bg-gray-50 p-4">
              <img
                src={booking.qrCode}
                alt="Booking QR Code"
                className="h-40 w-40"
              />
              <p className="mt-2 text-xs text-gray-500">
                Show this QR code at the cinema
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =======================
  BookingHistory Component
======================= */

const BookingHistory: React.FC = () => {
  const {
    getMyBookings,
    cancelBooking,
    isLoading: contextLoading,
  } = useBooking();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">(
    "upcoming"
  );

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * Fetch user's bookings
   */
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getMyBookings({ limit: 100 });
      setBookings(result.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [getMyBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /**
   * Group bookings by status
   */
  const groupedBookings: GroupedBookings = bookings.reduce(
    (groups, booking) => {
      const now = new Date();
      const showtimeStart = booking.showtime?.startTime
        ? new Date(booking.showtime.startTime)
        : null;

      if (booking.bookingStatus === "cancelled") {
        groups.cancelled.push(booking);
      } else if (showtimeStart && showtimeStart < now) {
        groups.past.push(booking);
      } else {
        groups.upcoming.push(booking);
      }

      return groups;
    },
    { upcoming: [], past: [], cancelled: [] } as GroupedBookings
  );

  /**
   * Check if booking can be cancelled
   */
  const canCancelBooking = (booking: Booking): boolean => {
    if (booking.bookingStatus === "cancelled") return false;

    const showtimeStart = booking.showtime?.startTime
      ? new Date(booking.showtime.startTime)
      : null;

    if (!showtimeStart) return false;

    // Can cancel if showtime hasn't started yet
    return showtimeStart > new Date();
  };

  /**
   * Handle cancel button click
   */
  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  /**
   * Handle cancel confirmation
   */
  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return;

    try {
      setIsCancelling(true);
      await cancelBooking(bookingToCancel.id);

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id
            ? { ...b, bookingStatus: "cancelled" as const }
            : b
        )
      );

      setCancelModalOpen(false);
      setBookingToCancel(null);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Get current tab bookings
   */
  const currentBookings = groupedBookings[activeTab];

  /**
   * Tab counts
   */
  const tabCounts = {
    upcoming: groupedBookings.upcoming.length,
    past: groupedBookings.past.length,
    cancelled: groupedBookings.cancelled.length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(["upcoming", "past", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Booking List */}
      {currentBookings.length === 0 ? (
        <div className="py-12 text-center">
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
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No {activeTab} bookings found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancelClick={handleCancelClick}
              canCancel={canCancelBooking(booking)}
            />
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <CancelModal
        booking={bookingToCancel}
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setBookingToCancel(null);
        }}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling || contextLoading}
      />
    </div>
  );
};

export default BookingHistory;

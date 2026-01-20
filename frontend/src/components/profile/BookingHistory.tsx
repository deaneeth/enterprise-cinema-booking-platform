// BookingHistory.tsx (Member 5)
// Booking history - Redesigned with Apple Human Interface Guidelines
// Premium UI with soft shadows, generous whitespace, smooth animations

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Cancel Confirmation Modal - Apple Style
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
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 mx-4 w-full max-w-sm p-8 transition-all duration-300 ease-out"
        style={{
          background: "#fff",
          borderRadius: "24px",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h3
          className="text-xl font-bold text-gray-900"
          style={{ letterSpacing: "-0.02em" }}
        >
          Cancel Booking?
        </h3>
        <p className="mt-3 text-gray-500 leading-relaxed">
          This action cannot be undone. Your seats will be released.
        </p>

        <div
          className="mt-6 p-4"
          style={{ background: "#f5f5f7", borderRadius: "16px" }}
        >
          <p className="font-semibold text-gray-900">
            #{booking.id.slice(-8).toUpperCase()}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {booking.numberOfSeats} seat(s) • ${booking.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3.5 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:opacity-50"
            style={{ borderRadius: "14px" }}
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3.5 font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #ff3b30 0%, #ff2d55 100%)",
              borderRadius: "14px",
            }}
          >
            {isLoading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =======================
  Booking Card Component - Apple Style
======================= */

interface BookingCardProps {
  booking: Booking;
  onCancelClick: (booking: Booking) => void;
  canCancel: boolean;
  onResumePayment: (booking: Booking) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancelClick,
  canCancel,
  onResumePayment,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const bookingData = booking as any;
  const showtime = bookingData.showtimeId || bookingData.showtime || {};
  const movie = showtime?.movieId || {};
  const cinema = showtime?.cinemaId || {};

  const isPendingWithValidExpiry =
    booking.bookingStatus === "pending" &&
    booking.expiresAt &&
    new Date(booking.expiresAt).getTime() > Date.now();

  useEffect(() => {
    if (!booking.expiresAt || booking.bookingStatus !== "pending") {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(booking.expiresAt!).getTime();
      const remaining = Math.max(
        0,
        Math.floor((expiresAt - Date.now()) / 1000),
      );
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking.expiresAt, booking.bookingStatus]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return { bg: "rgba(52, 199, 89, 0.12)", color: "#34c759" };
      case "pending":
        return { bg: "rgba(255, 149, 0, 0.12)", color: "#ff9500" };
      case "cancelled":
      case "expired":
        return { bg: "rgba(142, 142, 147, 0.12)", color: "#8e8e93" };
      default:
        return { bg: "rgba(142, 142, 147, 0.12)", color: "#8e8e93" };
    }
  };

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

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `ticket-${booking.id.slice(-8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const statusStyle = getStatusStyle(booking.bookingStatus);

  return (
    <div
      className="overflow-hidden transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: "#fff",
        borderRadius: "24px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="flex flex-col sm:flex-row" ref={ticketRef}>
        {/* Movie Poster */}
        <div className="flex-shrink-0 p-4 sm:p-5">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title || "Movie"}
              className="w-full sm:w-28 h-40 object-cover"
              style={{ borderRadius: "16px" }}
            />
          ) : (
            <div
              className="flex w-full sm:w-28 h-40 items-center justify-center bg-gray-100 text-sm text-gray-400"
              style={{ borderRadius: "16px" }}
            >
              No Image
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="flex-1 p-4 sm:p-5 sm:pl-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                className="text-lg font-bold text-gray-900"
                style={{ letterSpacing: "-0.01em" }}
              >
                {movie.title || "Movie Title"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {cinema.name || "Cinema"}
                {showtime?.screenNumber && ` • Screen ${showtime.screenNumber}`}
              </p>
            </div>
            <span
              className="px-3 py-1.5 text-xs font-semibold shrink-0"
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                borderRadius: "10px",
              }}
            >
              {booking.bookingStatus.charAt(0).toUpperCase() +
                booking.bookingStatus.slice(1)}
            </span>
          </div>

          {/* Show Details */}
          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Date
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {showtime?.startTime ? formatDate(showtime.startTime) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Time
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {showtime?.startTime ? formatTime(showtime.startTime) : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Seats
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatSeats()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total
              </p>
              <p className="mt-1 font-bold" style={{ color: "#007aff" }}>
                ${booking.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-5 flex items-center justify-between text-xs text-gray-400">
            <span>#{booking.id.slice(-8).toUpperCase()}</span>
            <span>
              Booked{" "}
              {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Timer for pending */}
          {booking.bookingStatus === "pending" &&
            timeRemaining !== null &&
            timeRemaining > 0 && (
              <div
                className="mt-4 flex items-center gap-2 px-4 py-3"
                style={{
                  background: "rgba(255, 149, 0, 0.08)",
                  borderRadius: "12px",
                }}
              >
                <svg
                  className="w-4 h-4"
                  style={{ color: "#ff9500" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm" style={{ color: "#ff9500" }}>
                  Expires in{" "}
                  <span className="font-bold">
                    {formatCountdown(timeRemaining)}
                  </span>
                </span>
              </div>
            )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="px-5 py-4 flex flex-wrap gap-3"
        style={{
          background: "#fafafa",
          borderTop: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        {booking.bookingStatus === "confirmed" && (
          <button
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
              borderRadius: "12px",
            }}
          >
            {isDownloading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            Download Ticket
          </button>
        )}

        {isPendingWithValidExpiry &&
          timeRemaining !== null &&
          timeRemaining > 0 && (
            <button
              onClick={() => onResumePayment(booking)}
              className="flex items-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #34c759 0%, #30a14e 100%)",
                borderRadius: "12px",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Complete Payment
            </button>
          )}

        {canCancel &&
          booking.bookingStatus !== "cancelled" &&
          booking.bookingStatus !== "expired" && (
            <button
              onClick={() => onCancelClick(booking)}
              className="px-5 py-2.5 font-semibold text-red-500 transition-all duration-200 hover:bg-red-50"
              style={{ borderRadius: "12px" }}
            >
              Cancel
            </button>
          )}
      </div>
    </div>
  );
};

/* =======================
  BookingHistory Component
======================= */

const BookingHistory: React.FC = () => {
  const navigate = useNavigate();
  const {
    getMyBookings,
    cancelBooking,
    isLoading: contextLoading,
  } = useBooking();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">(
    "upcoming",
  );

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const groupedBookings: GroupedBookings = bookings.reduce(
    (groups, booking) => {
      const now = new Date();
      const showtimeStart = booking.showtime?.startTime
        ? new Date(booking.showtime.startTime)
        : null;

      if (
        booking.bookingStatus === "cancelled" ||
        booking.bookingStatus === "expired"
      ) {
        groups.cancelled.push(booking);
      } else if (showtimeStart && showtimeStart < now) {
        groups.past.push(booking);
      } else {
        groups.upcoming.push(booking);
      }
      return groups;
    },
    { upcoming: [], past: [], cancelled: [] } as GroupedBookings,
  );

  const canCancelBooking = (booking: Booking): boolean => {
    if (booking.bookingStatus === "cancelled") return false;
    const showtimeStart = booking.showtime?.startTime
      ? new Date(booking.showtime.startTime)
      : null;
    if (!showtimeStart) return false;
    return showtimeStart > new Date();
  };

  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return;
    try {
      setIsCancelling(true);
      await cancelBooking(bookingToCancel.id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id
            ? { ...b, bookingStatus: "cancelled" as const }
            : b,
        ),
      );
      setCancelModalOpen(false);
      setBookingToCancel(null);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResumePayment = (booking: Booking) => {
    if (booking.showtime?.id) {
      sessionStorage.setItem(`booking:${booking.showtime.id}`, booking.id);
    }
    navigate(`/payment/${booking.id}`);
  };

  const currentBookings = groupedBookings[activeTab];
  const tabCounts = {
    upcoming: groupedBookings.upcoming.length,
    past: groupedBookings.past.length,
    cancelled: groupedBookings.cancelled.length,
  };

  const tabs = [
    { id: "upcoming" as const, label: "Upcoming" },
    { id: "past" as const, label: "Past" },
    { id: "cancelled" as const, label: "Cancelled" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "3px solid #e5e5e5", borderTopColor: "#007aff" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchBookings}
          className="px-6 py-3 font-semibold text-white"
          style={{
            background: "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
            borderRadius: "14px",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Segmented Control */}
      <div
        className="p-1 mb-8"
        style={{ background: "rgba(0, 0, 0, 0.04)", borderRadius: "14px" }}
      >
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                font-semibold text-sm transition-all duration-300 ease-out
                ${activeTab === tab.id ? "bg-white text-gray-900" : "text-gray-500"}
              `}
              style={{
                borderRadius: "10px",
                boxShadow:
                  activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
              <span
                className="px-2 py-0.5 text-xs"
                style={{
                  background:
                    activeTab === tab.id
                      ? "rgba(0,122,255,0.1)"
                      : "rgba(0,0,0,0.05)",
                  color: activeTab === tab.id ? "#007aff" : "#8e8e93",
                  borderRadius: "6px",
                }}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Booking List */}
      {currentBookings.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="mx-auto w-16 h-16 flex items-center justify-center mb-6"
            style={{ background: "#f5f5f7", borderRadius: "50%" }}
          >
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            No {activeTab} bookings
          </p>
          <p className="mt-2 text-gray-500">Your bookings will appear here</p>
        </div>
      ) : (
        <div className="space-y-5">
          {currentBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancelClick={handleCancelClick}
              canCancel={canCancelBooking(booking)}
              onResumePayment={handleResumePayment}
            />
          ))}
        </div>
      )}

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

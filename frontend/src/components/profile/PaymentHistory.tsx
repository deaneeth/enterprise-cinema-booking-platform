// PaymentHistory.tsx (Member 7)
// Payment history - Redesigned with Apple Human Interface Guidelines
// Premium UI with soft shadows, generous whitespace, smooth animations

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { paymentsApi, Payment } from "../../services/api";

const PaymentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const response = await paymentsApi.getMyPayments();
        if (response.data.success && response.data.data) {
          setPayments(response.data.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "rgba(52, 199, 89, 0.12)",
          color: "#34c759",
          label: "Completed",
        };
      case "pending":
        return {
          bg: "rgba(255, 149, 0, 0.12)",
          color: "#ff9500",
          label: "Pending",
        };
      case "failed":
        return {
          bg: "rgba(255, 59, 48, 0.12)",
          color: "#ff3b30",
          label: "Failed",
        };
      case "refunded":
        return {
          bg: "rgba(175, 82, 222, 0.12)",
          color: "#af52de",
          label: "Refunded",
        };
      case "cancelled":
        return {
          bg: "rgba(142, 142, 147, 0.12)",
          color: "#8e8e93",
          label: "Cancelled",
        };
      default:
        return {
          bg: "rgba(142, 142, 147, 0.12)",
          color: "#8e8e93",
          label: status,
        };
    }
  };

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
          onClick={() => window.location.reload()}
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

  if (payments.length === 0) {
    return (
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">
          No payment history
        </p>
        <p className="mt-2 text-gray-500">Your transactions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const booking = payment.bookingId as any;
        const showtime = booking?.showtimeId;
        const movie = showtime?.movieId;
        const statusStyle = getStatusStyle(payment.paymentStatus);

        const isPendingPayment = payment.paymentStatus === "pending";
        const bookingExpiresAt = booking?.expiresAt;
        const isBookingValid =
          bookingExpiresAt && new Date(bookingExpiresAt).getTime() > Date.now();
        const canResume = isPendingPayment && isBookingValid;

        return (
          <div
            key={payment._id}
            className="overflow-hidden transition-all duration-300 hover:scale-[1.01]"
            style={{
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-gray-900 truncate"
                    style={{ fontSize: "17px", letterSpacing: "-0.01em" }}
                  >
                    {movie?.title || "Movie Ticket"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(payment.paymentDate || payment.createdAt)}
                    {" • "}
                    {formatTime(payment.paymentDate || payment.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-xl font-bold"
                    style={{
                      color:
                        payment.paymentStatus === "completed"
                          ? "#34c759"
                          : "#1d1d1f",
                    }}
                  >
                    ${payment.amount?.toFixed(2)}
                  </p>
                  <span
                    className="inline-block mt-1 px-2.5 py-1 text-xs font-semibold"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      borderRadius: "8px",
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div
                className="mt-5 flex flex-wrap gap-6 pt-5"
                style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Method
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {payment.paymentMethod === "paypal"
                      ? "PayPal"
                      : payment.paymentMethod}
                  </p>
                </div>
                {booking?.numberOfSeats && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Seats
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {booking.numberOfSeats}
                    </p>
                  </div>
                )}
                {payment.paypalCaptureId && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Transaction
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-600">
                      ...{payment.paypalCaptureId.slice(-8)}
                    </p>
                  </div>
                )}
              </div>

              {/* Resume Payment */}
              {isPendingPayment && (
                <div
                  className="mt-5 pt-5 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
                >
                  {canResume ? (
                    <>
                      <div
                        className="flex items-center gap-2"
                        style={{ color: "#ff9500" }}
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          Payment pending
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/payment/${booking._id}`)}
                        className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition-all duration-200"
                        style={{
                          background:
                            "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
                          borderRadius: "10px",
                        }}
                      >
                        Complete Payment
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm">Expired</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentHistory;

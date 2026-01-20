// PaymentHistory.tsx (Member 7)
// Payment history component - Displays user's payment transactions
// Shows payment status, amount, and related booking info

import React, { useEffect, useState } from "react";
import { paymentsApi, Payment } from "../../services/api";

const PaymentHistory: React.FC = () => {
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No payment history found</p>
        <p className="text-xs text-gray-400">
          Your payment transactions will appear here after you make a booking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => {
        const booking = payment.bookingId as any;
        const showtime = booking?.showtimeId;
        const movie = showtime?.movieId;

        return (
          <div
            key={payment._id}
            className="rounded-lg bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {movie?.title || "Movie Ticket"}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(payment.paymentDate || payment.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {payment.currency || "USD"} {payment.amount?.toFixed(2)}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                    payment.paymentStatus,
                  )}`}
                >
                  {payment.paymentStatus.charAt(0).toUpperCase() +
                    payment.paymentStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Transaction details */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-500">
              <div>
                <span className="text-gray-400">Method:</span>{" "}
                {payment.paymentMethod === "paypal"
                  ? "PayPal"
                  : payment.paymentMethod}
              </div>
              {payment.paypalCaptureId && (
                <div>
                  <span className="text-gray-400">Trans. ID:</span>{" "}
                  <span className="font-mono text-xs">
                    ...{payment.paypalCaptureId.slice(-8)}
                  </span>
                </div>
              )}
              {booking?.numberOfSeats && (
                <div>
                  <span className="text-gray-400">Seats:</span>{" "}
                  {booking.numberOfSeats}
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

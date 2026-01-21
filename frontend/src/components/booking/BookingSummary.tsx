// BookingSummary.tsx (Member 6)
// Booking summary component - Displays selected seats, pricing, and hold timer
// Shows booking details and proceeds to payment when ready

import React, { useEffect, useState } from "react";

/* =======================
  Types and Interfaces
======================= */

interface SeatData {
  _id: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: "regular" | "vip" | "wheelchair";
  status: "available" | "held" | "booked";
  price: number;
}

interface Showtime {
  _id: string;
  movieId: {
    _id: string;
    title: string;
    posterUrl?: string;
  };
  cinemaId: {
    _id: string;
    name: string;
  };
  startTime: string;
  date: string;
  screenNumber?: number;
  price: number;
}

interface BookingSummaryProps {
  selectedSeats: SeatData[];
  showtime: Showtime | null;
  onProceedToPayment: () => void;
  onClearSelection: () => void;
  onRemoveSeat?: (seatId: string) => void;
  holdTimeRemaining?: number | null;
}

/* =======================
  BookingSummary Component
======================= */

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedSeats,
  showtime,
  onProceedToPayment,
  onClearSelection,
  onRemoveSeat,
  holdTimeRemaining,
}) => {
  const [priceBreakdown, setPriceBreakdown] = useState<{
    regular: { count: number; price: number; subtotal: number };
    vip: { count: number; price: number; subtotal: number };
    total: number;
  } | null>(null);

  // Calculate price breakdown
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setPriceBreakdown(null);
      return;
    }

    const regularSeats = selectedSeats.filter((s) => s.seatType === "regular");
    const vipSeats = selectedSeats.filter((s) => s.seatType === "vip");

    const regularPrice = regularSeats.length > 0 ? regularSeats[0].price : 0;
    const vipPrice = vipSeats.length > 0 ? vipSeats[0].price : 0;

    const breakdown = {
      regular: {
        count: regularSeats.length,
        price: regularPrice,
        subtotal: regularSeats.length * regularPrice,
      },
      vip: {
        count: vipSeats.length,
        price: vipPrice,
        subtotal: vipSeats.length * vipPrice,
      },
      total: regularSeats.length * regularPrice + vipSeats.length * vipPrice,
    };

    setPriceBreakdown(breakdown);
  }, [selectedSeats]);

  // Format date and time
  const formatDateTime = (): string => {
    if (!showtime) return "";
    const date = new Date(showtime.startTime);
    const time = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `${dateStr} at ${time}`;
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!showtime) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500">Loading showtime details...</p>
      </div>
    );
  }

  const isReadyForPayment = selectedSeats.length > 0 && priceBreakdown;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
      {/* Movie Info */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg text-gray-800 mb-2">
          {showtime.movieId?.title || "Movie"}
        </h3>
        <p className="text-sm text-gray-600">
          {showtime.cinemaId?.name || "Cinema"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Screen {showtime.screenNumber || "-"}
        </p>
      </div>

      {/* Date and Time */}
      <div className="bg-blue-50 rounded-lg p-3 mb-6">
        <p className="text-sm font-medium text-blue-900">
          📅 {formatDateTime()}
        </p>
      </div>

      {/* Hold Timer */}
      {holdTimeRemaining !== null && holdTimeRemaining !== undefined && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            holdTimeRemaining <= 60
              ? "bg-red-50 border border-red-200"
              : holdTimeRemaining <= 180
                ? "bg-orange-50 border border-orange-200"
                : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                holdTimeRemaining <= 60
                  ? "text-red-700"
                  : holdTimeRemaining <= 180
                    ? "text-orange-700"
                    : "text-emerald-700"
              }`}
            >
              ⏱️ Hold Timer
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                holdTimeRemaining <= 60
                  ? "bg-red-100 text-red-700"
                  : holdTimeRemaining <= 180
                    ? "bg-orange-100 text-orange-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {holdTimeRemaining <= 60 ? "Hurry!" : "Active"}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              holdTimeRemaining <= 60
                ? "text-red-600"
                : holdTimeRemaining <= 180
                  ? "text-orange-600"
                  : "text-emerald-600"
            }`}
          >
            {formatTime(holdTimeRemaining)}
          </p>
          <p
            className={`text-xs mt-1 ${
              holdTimeRemaining <= 60
                ? "text-red-600"
                : holdTimeRemaining <= 180
                  ? "text-orange-600"
                  : "text-emerald-600"
            }`}
          >
            Seats held for this duration
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Selected Seats */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Selected Seats</h4>
        {selectedSeats.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No seats selected</p>
        ) : (
          <div className="space-y-2">
            {/* Regular Seats */}
            {selectedSeats.filter((s) => s.seatType === "regular").length >
              0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Regular Seats
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats
                    .filter((s) => s.seatType === "regular")
                    .map((seat) => (
                      <span
                        key={seat._id}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        {seat.seatNumber}
                        <button
                          onClick={() => onRemoveSeat?.(seat._id)}
                          className="ml-1 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* VIP Seats */}
            {selectedSeats.filter((s) => s.seatType === "vip").length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  VIP Seats 👑
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats
                    .filter((s) => s.seatType === "vip")
                    .map((seat) => (
                      <span
                        key={seat._id}
                        className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        {seat.seatNumber}
                        <button
                          onClick={() => onRemoveSeat?.(seat._id)}
                          className="ml-1 hover:text-purple-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Wheelchair Seats */}
            {selectedSeats.filter((s) => s.seatType === "wheelchair").length >
              0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Wheelchair Accessible ♿
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats
                    .filter((s) => s.seatType === "wheelchair")
                    .map((seat) => (
                      <span
                        key={seat._id}
                        className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                      >
                        {seat.seatNumber}
                        <button
                          onClick={() => onRemoveSeat?.(seat._id)}
                          className="ml-1 hover:text-green-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Price Breakdown */}
      {priceBreakdown && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Price Details</h4>
          <div className="space-y-2 text-sm">
            {priceBreakdown.regular.count > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  Regular Seats ({priceBreakdown.regular.count}) × $
                  {priceBreakdown.regular.price}
                </span>
                <span className="font-medium">
                  ${priceBreakdown.regular.subtotal}
                </span>
              </div>
            )}
            {priceBreakdown.vip.count > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>
                  VIP Seats ({priceBreakdown.vip.count}) × $
                  {priceBreakdown.vip.price}
                </span>
                <span className="font-medium">
                  ${priceBreakdown.vip.subtotal}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Total */}
            <div className="flex justify-between font-bold text-lg text-gray-900">
              <span>Total Amount</span>
              <span className="text-blue-600">${priceBreakdown.total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onProceedToPayment}
          disabled={!isReadyForPayment}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            isReadyForPayment
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isReadyForPayment
            ? "Proceed to Payment"
            : "Select Seats to Continue"}
        </button>

        <button
          onClick={onClearSelection}
          disabled={selectedSeats.length === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
            selectedSeats.length > 0
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Clear Selection
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 space-y-3">
        {/* Seat Hold Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm">🔒</span>
            <div>
              <p className="text-xs font-medium text-blue-800">
                Seats Reserved, Not Booked Yet
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Your selected seats are held for other customers. Feel free to
                add or remove seats during this time.
              </p>
            </div>
          </div>
        </div>

        {/* Booking Creation Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm">💡</span>
            <div>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Tip:</span> Your booking will be
                created when you click "Proceed to Payment". Complete payment
                within the timer to confirm your seats.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;

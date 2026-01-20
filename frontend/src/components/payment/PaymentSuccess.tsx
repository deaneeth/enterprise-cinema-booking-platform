import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Payment, Booking, Showtime, Movie, Cinema } from "../../services/api";

interface PopulatedShowtime extends Omit<Showtime, "movieId" | "cinemaId"> {
  movieId: Movie;
  cinemaId: Cinema;
}

interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: "regular" | "vip" | "wheelchair";
  price: number;
}

interface PopulatedBooking extends Omit<Booking, "showtimeId" | "seatIds"> {
  showtimeId: PopulatedShowtime;
  seatIds: Seat[];
  qrCode?: string;
}

interface PaymentSuccessProps {
  booking: Booking | PopulatedBooking;
  payment: Payment;
}

interface TicketCardProps {
  booking: PopulatedBooking;
  payment: Payment;
  qrCodeUrl: string;
  ticketRef: React.RefObject<HTMLDivElement>;
}

const TicketCard: React.FC<TicketCardProps> = ({
  booking,
  payment,
  qrCodeUrl,
  ticketRef,
}) => {
  const showtime = booking.showtimeId;
  const movie = typeof showtime === "object" ? showtime.movieId : null;
  const cinema = typeof showtime === "object" ? showtime.cinemaId : null;
  const seats = Array.isArray(booking.seatIds) ? booking.seatIds : [];

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (dateString: string): string =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const getSeatLabels = (): string =>
    seats.length === 0
      ? "N/A"
      : seats.map((s) => s.seatNumber || `${s.row}${s.column}`).join(", ");

  return (
    <div
      ref={ticketRef}
      style={{
        width: "320px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
        borderRadius: "20px",
        background: "#fff",
        boxShadow:
          "0 20px 40px -12px rgba(0,0,0,0.12), 0 4px 16px -4px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div className="p-5">
        <div className="flex gap-3">
          <div style={{ borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
            {movie?.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie?.title}
                style={{ width: "64px", height: "96px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="bg-gray-100 flex items-center justify-center"
                style={{ width: "64px", height: "96px" }}
              >
                <span className="text-gray-300 text-xs">No img</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 truncate"
              style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
            >
              {movie?.title || "Movie"}
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {(showtime as any)?.format || "2D"} • {movie?.rating || "NR"}
            </p>
            <div className="mt-2" style={{ color: "#B8860B" }}>
              <p className="font-semibold" style={{ fontSize: "17px" }}>
                {showtime?.startTime ? formatDate(showtime.startTime) : "TBD"}
              </p>
              <p className="font-semibold" style={{ fontSize: "17px" }}>
                {showtime?.startTime ? formatTime(showtime.startTime) : "TBD"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-3">
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8"
          style={{ background: "#e8e8ed", borderRadius: "0 16px 16px 0" }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8"
          style={{ background: "#e8e8ed", borderRadius: "16px 0 0 16px" }}
        />
        <div className="mx-6 border-t-2 border-dashed border-gray-200" />
      </div>

      <div className="px-5 py-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Cinema
            </p>
            <p className="text-gray-900 font-medium mt-0.5 truncate">
              {cinema?.name || "Cinema"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Seats
            </p>
            <p className="text-gray-900 font-medium mt-0.5">{getSeatLabels()}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Screen
            </p>
            <p className="text-gray-900 font-medium mt-0.5">
              Hall {showtime?.screenNumber || "1"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wide" style={{ fontSize: "10px" }}>
              Order
            </p>
            <p className="text-gray-900 font-medium mt-0.5">
              #{booking._id?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div
        className="mx-5 mb-5 py-5 flex flex-col items-center"
        style={{ background: "#fafafa", borderRadius: "14px" }}
      >
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR" style={{ width: "120px", height: "120px" }} />
        ) : (
          <div
            className="bg-gray-200 flex items-center justify-center"
            style={{ width: "120px", height: "120px", borderRadius: "8px" }}
          >
            <span className="text-gray-400 text-xs">Loading...</span>
          </div>
        )}
        <p className="text-gray-400 text-sm mt-3">Scan this QR code at the entrance</p>
      </div>

      <div className="px-5 py-4 text-center" style={{ background: "#f5f5f5" }}>
        <p className="text-gray-600 text-sm">
          Total: <span className="font-semibold" style={{ color: "#34c759" }}>${payment.amount?.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
};

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ booking, payment }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const populatedBooking = booking as PopulatedBooking;

  useEffect(() => {
    const qrData = populatedBooking.qrCode || booking._id;
    setQrCodeUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    );
  }, [booking._id, populatedBooking.qrCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(booking._id?.slice(-8).toUpperCase() || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = async () => {
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
      link.download = `ticket-${booking._id?.slice(-8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center gap-20 px-12">
        <div style={{ width: "380px" }}>
          <div
            className="w-16 h-16 flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, #34c759 0%, #30a14e 100%)",
              borderRadius: "50%",
              boxShadow: "0 8px 24px rgba(52,199,89,0.4)",
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1
            className="text-3xl font-bold text-gray-900 mb-3"
            style={{ letterSpacing: "-0.02em" }}
          >
            Payment Successful
          </h1>
          <p className="text-gray-500 leading-relaxed mb-8" style={{ fontSize: "15px" }}>
            Your ticket is confirmed. Show the QR code at the cinema entrance.
          </p>

          <div
            className="p-5 mb-5"
            style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Reference</p>
                <p
                  className="font-bold text-gray-900 mt-1"
                  style={{ fontSize: "22px", fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}
                >
                  #{booking._id?.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  background: copied ? "#dcfce7" : "#fff",
                  color: copied ? "#166534" : "#1d1d1f",
                  border: copied ? "1px solid #86efac" : "1px solid #e5e5e5",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-gray-400 text-sm">Amount Paid</span>
              <span className="font-bold text-xl" style={{ color: "#34c759" }}>
                ${payment.amount?.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-3.5 font-semibold text-white rounded-xl mb-3 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #007aff 0%, #0055b3 100%)",
              boxShadow: "0 4px 14px rgba(0,122,255,0.35)",
              fontSize: "16px",
            }}
          >
            {isDownloading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Download Ticket
          </button>

          <button
            onClick={() => navigate("/profile?tab=bookings")}
            className="w-full py-3.5 font-semibold rounded-xl mb-3 transition-colors"
            style={{
              background: "#fff",
              color: "#1d1d1f",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
              fontSize: "16px",
            }}
          >
            View My Bookings
          </button>

          <button
            onClick={() => navigate("/movies")}
            className="w-full py-2 font-medium text-sm transition-colors"
            style={{ color: "#007aff" }}
          >
            Back to Movies
          </button>
        </div>

        <div className="h-96 w-px" style={{ background: "rgba(0,0,0,0.08)" }} />

        <div className="flex flex-col items-center">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{ color: "#86868b", letterSpacing: "0.15em" }}
          >
            Your Ticket
          </p>
          <TicketCard
            booking={populatedBooking}
            payment={payment}
            qrCodeUrl={qrCodeUrl}
            ticketRef={ticketRef}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

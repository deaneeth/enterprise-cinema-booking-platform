import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Payment, Booking, Showtime, Movie, Cinema } from '../../services/api';

/**
 * Extended types for populated booking data
 */
interface PopulatedShowtime extends Omit<Showtime, 'movieId' | 'cinemaId'> {
  movieId: Movie;
  cinemaId: Cinema;
}

interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: 'regular' | 'vip' | 'wheelchair';
  price: number;
}

interface PopulatedBooking extends Omit<Booking, 'showtimeId' | 'seatIds'> {
  showtimeId: PopulatedShowtime;
  seatIds: Seat[];
  qrCode?: string;
}

/**
 * Props interface for PaymentSuccess component
 */
interface PaymentSuccessProps {
  booking: Booking | PopulatedBooking;
  payment: Payment;
}

/**
 * PaymentSuccess component for confirmed bookings
 * Shows booking confirmation with QR code and details
 */
const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ booking, payment }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Cast to populated booking for type safety
  const populatedBooking = booking as PopulatedBooking;
  const showtime = populatedBooking.showtimeId;
  const movie = typeof showtime === 'object' ? showtime.movieId : null;
  const cinema = typeof showtime === 'object' ? showtime.cinemaId : null;
  const seats = Array.isArray(populatedBooking.seatIds) ? populatedBooking.seatIds : [];

  // Generate QR code URL (using QR Server API as fallback if no qrCode in booking)
  useEffect(() => {
    if (populatedBooking.qrCode) {
      setQrCodeUrl(populatedBooking.qrCode);
    } else {
      // Generate QR code using public API
      const bookingRef = booking._id;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingRef)}`;
      setQrCodeUrl(qrApiUrl);
    }
  }, [booking._id, populatedBooking.qrCode]);

  /**
   * Copy booking reference to clipboard
   */
  const handleCopyReference = async (): Promise<void> => {
    try {
      const reference = booking._id?.slice(-8).toUpperCase() || '';
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format payment date
   */
  const formatPaymentDate = (dateString?: string): string => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get seat numbers as comma-separated string
   */
  const getSeatNumbers = (): string => {
    if (seats.length === 0) return 'N/A';
    return seats.map((seat) => seat.seatNumber || `${seat.row}${seat.column}`).join(', ');
  };

  /**
   * Download QR code as image
   */
  const handleDownloadQR = (): void => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `booking-${booking._id?.slice(-8)}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          {/* Animated Checkmark */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">Your tickets are confirmed</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Booking Reference */}
          <div className="bg-green-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Booking Reference</p>
                <p className="text-2xl font-mono font-bold tracking-wider">
                  #{booking._id?.slice(-8).toUpperCase() || 'N/A'}
                </p>
              </div>
              <button
                onClick={handleCopyReference}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 px-3 py-2 rounded-md transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 border-b border-gray-200 text-center bg-gray-50">
            <div className="inline-block p-4 bg-white rounded-lg shadow-sm mb-4">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Booking QR Code"
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                  <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-600 font-medium mb-2">Show this QR code at the cinema</p>
            <button
              onClick={handleDownloadQR}
              className="text-sm text-indigo-600 hover:text-indigo-700 underline print:hidden"
            >
              Download QR Code
            </button>
          </div>

          {/* Booking Details */}
          <div className="p-6">
            <div className="flex gap-4 mb-6">
              {/* Movie Poster */}
              {movie?.posterUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-24 h-36 object-cover rounded-lg shadow-sm"
                  />
                </div>
              )}
              
              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {movie?.title || 'Movie'}
                </h3>
                {movie?.rating && (
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded mb-3">
                    {movie.rating}
                  </span>
                )}
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{cinema?.name || 'Cinema'}</span>
                    {showtime?.screenNumber && <span className="text-gray-400">• Screen {showtime.screenNumber}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{showtime?.startTime ? formatDate(showtime.startTime) : 'Date TBD'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{showtime?.startTime ? formatTime(showtime.startTime) : 'Time TBD'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="font-medium">{getSeatNumbers()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Paid */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount Paid</span>
                <span className="text-2xl font-bold text-green-600">
                  {payment.currency || 'USD'} {payment.amount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="text-gray-900 flex items-center gap-2">
                    {payment.paymentMethod === 'paypal' ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.645h6.93c2.603 0 4.447.532 5.472 1.582.976 1 1.268 2.264.867 3.77-.483 1.808-1.426 3.119-2.8 3.899-1.37.778-3.143 1.166-5.263 1.166H8.89a.769.769 0 0 0-.757.645l-.953 5.56a.641.641 0 0 1-.632.543l-.472 3.097Z"/>
                        </svg>
                        PayPal
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {payment.paymentDetails?.cardBrand || 'Card'} ****{payment.paymentDetails?.cardLastFour || '****'}
                      </>
                    )}
                  </span>
                </div>
                
                {payment.paypalCaptureId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="text-gray-900 font-mono text-xs">
                      ...{payment.paypalCaptureId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{formatPaymentDate(payment.paymentDate)}</span>
                </div>
                
                {payment.payerEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payer Email</span>
                    <span className="text-gray-900">{payment.payerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                onClick={() => navigate('/profile/bookings')}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                View My Bookings
              </button>
              <button
                onClick={() => navigate('/movies')}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Back to Movies
              </button>
            </div>
          </div>

          {/* Email Confirmation Note */}
          <div className="bg-blue-50 px-6 py-4 border-t border-blue-100">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-blue-800">
                A confirmation email has been sent to your registered email address with your booking details and QR code.
              </p>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="text-center mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

// Payment.tsx (Member 7)
// Payment page - Handles booking summary display and PayPal checkout
// Shows countdown timer, booking details, and payment form

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PaymentForm from '../components/payment/PaymentForm';
import PaymentSuccess from '../components/payment/PaymentSuccess';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { bookingsApi, Payment, Booking } from '../services/api';

/* =======================
  Types and Interfaces
======================= */

interface Movie {
  _id: string;
  title: string;
  posterUrl?: string;
  duration?: number;
  rating?: string;
  genre?: string[];
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
  endTime?: string;
  date: string;
  price: number;
  screenNumber?: number;
}

interface Seat {
  _id: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: 'regular' | 'vip' | 'wheelchair';
  price: number;
}

interface PopulatedBooking {
  _id: string;
  userId: string;
  showtimeId: Showtime;
  seatIds: Seat[];
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled';
  bookingDate: string;
  paymentId?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

type PaymentState = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'expired';

/* =======================
  Payment Page Component
======================= */

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [booking, setBooking] = useState<PopulatedBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null);
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  /**
   * Fetch booking details
   */
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setError('Booking ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if booking data was passed through location state
        if (location.state?.booking) {
          // We still need to fetch full booking to get populated data
        }

        const response = await bookingsApi.getById(bookingId);
        
        if (response.data.success && response.data.data) {
          const bookingData = response.data.data as PopulatedBooking;
          setBooking(bookingData);

          // Check if booking is already confirmed or cancelled
          if (bookingData.bookingStatus === 'confirmed') {
            setPaymentState('success');
          } else if (bookingData.bookingStatus === 'cancelled') {
            setPaymentState('cancelled');
          }

          // Calculate time remaining based on booking creation time
          const createdAt = new Date(bookingData.createdAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000);
          const remaining = Math.max(0, 600 - elapsed); // 10 minutes = 600 seconds
          setTimeRemaining(remaining);

          if (remaining === 0 && bookingData.bookingStatus === 'pending') {
            setPaymentState('expired');
          }
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, location.state]);

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (paymentState !== 'pending' || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentState('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState, timeRemaining]);

  /**
   * Format countdown time
   */
  const formatCountdown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

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
   * Handle payment success
   */
  const handlePaymentSuccess = (payment: Payment, updatedBooking: Booking): void => {
    setSuccessPayment(payment);
    setSuccessBooking(updatedBooking);
    setPaymentState('success');
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (errorMessage: string): void => {
    setError(errorMessage);
    setPaymentState('failed');
  };

  /**
   * Handle payment cancel
   */
  const handlePaymentCancel = (): void => {
    setShowCancelDialog(true);
  };

  /**
   * Confirm cancel booking
   */
  const confirmCancelBooking = async (): Promise<void> => {
    if (!bookingId) return;

    try {
      await bookingsApi.cancel(bookingId);
      setPaymentState('cancelled');
      setShowCancelDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  /**
   * Retry payment
   */
  const handleRetry = (): void => {
    setError(null);
    setPaymentState('pending');
  };

  // Loading state
  if (loading) {
    return <Loading fullScreen message="Loading booking details..." />;
  }

  // Error state (no booking)
  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The booking you are looking for does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate('/movies')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Browse Movies
          </button>
        </div>
      </div>
    );
  }

  // Expired state
  if (paymentState === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Expired</h2>
          <p className="text-gray-600 mb-6">
            Your booking has expired due to the 10-minute payment window. 
            The seats have been released and are available for other customers.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/movies/${booking.showtimeId?.movieId?._id}`)}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Book Again
            </button>
            <button
              onClick={() => navigate('/movies')}
              className="w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Browse Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cancelled state
  if (paymentState === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been cancelled. The seats have been released and are available for other customers.
          </p>
          <button
            onClick={() => navigate('/movies')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Return to Movies
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentState === 'success' && successPayment && successBooking) {
    return (
      <PaymentSuccess 
        booking={successBooking} 
        payment={successPayment} 
      />
    );
  }

  // Failed state
  if (paymentState === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{error || 'There was an error processing your payment. Please try again.'}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/movies')}
              className="w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return to Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main payment view (pending state)
  const showtime = booking.showtimeId;
  const movie = showtime?.movieId;
  const cinema = showtime?.cinemaId;
  const seats = booking.seatIds || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Countdown Timer Banner */}
        <div className={`mb-6 rounded-lg p-4 flex items-center justify-between ${
          timeRemaining <= 60 ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <svg className={`h-6 w-6 ${timeRemaining <= 60 ? 'text-red-600' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-medium ${timeRemaining <= 60 ? 'text-red-800' : 'text-yellow-800'}`}>
              Complete payment in:
            </span>
          </div>
          <span className={`text-2xl font-bold font-mono ${timeRemaining <= 60 ? 'text-red-600' : 'text-yellow-600'}`}>
            {formatCountdown(timeRemaining)}
          </span>
        </div>

        {/* Error Message */}
        {error && paymentState === 'pending' && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Booking Summary */}
          <div className="lg:w-2/5">
            <div className="bg-white rounded-lg shadow-md overflow-hidden lg:sticky lg:top-8">
              {/* Movie Poster */}
              {movie?.posterUrl && (
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Movie Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {movie?.title || 'Movie'}
                </h2>

                {/* Rating Badge */}
                {movie?.rating && (
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded mb-4">
                    {movie.rating}
                  </span>
                )}

                {/* Showtime Details */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{cinema?.name || 'Cinema'}</span>
                    {showtime?.screenNumber && <span className="text-gray-400">• Screen {showtime.screenNumber}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{showtime?.startTime ? formatDate(showtime.startTime) : 'Date TBD'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{showtime?.startTime ? formatTime(showtime.startTime) : 'Time TBD'}</span>
                  </div>
                </div>

                {/* Selected Seats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Seats</h3>
                  <div className="flex flex-wrap gap-2">
                    {seats.map((seat) => (
                      <span
                        key={seat._id}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          seat.seatType === 'vip'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {seat.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>{booking.numberOfSeats} seat{booking.numberOfSeats > 1 ? 's' : ''} × USD {showtime?.price?.toFixed(2) || '0.00'}</span>
                      <span>USD {(booking.numberOfSeats * (showtime?.price || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      USD {booking.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:w-3/5">
            <PaymentForm
              bookingId={booking._id}
              amount={booking.totalAmount}
              currency="USD"
              movieTitle={movie?.title || 'Movie Ticket'}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />

            {/* Cancel Booking Option */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-sm text-gray-500 hover:text-red-600 underline"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this booking? Your selected seats will be released and made available for other customers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;

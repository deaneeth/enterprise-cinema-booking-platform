import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Payment, Booking } from '../../services/api';

/**
 * Props interface for PaymentSuccess component
 */
interface PaymentSuccessProps {
  booking: Booking;
  payment: Payment;
}

/**
 * PaymentSuccess component - Placeholder
 * TODO: Full implementation in Task 7.3
 */
const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ booking, payment }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your tickets have been confirmed.</p>

        {/* Booking Reference */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">Booking Reference</p>
          <p className="text-xl font-mono font-bold text-gray-900">
            #{booking._id?.slice(-8).toUpperCase() || 'N/A'}
          </p>
        </div>

        {/* Amount Paid */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">Amount Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {payment.currency || 'USD'} {payment.amount?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/profile/bookings')}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/movies')}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Movies
          </button>
        </div>

        {/* Email Note */}
        <p className="mt-6 text-sm text-gray-500">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;

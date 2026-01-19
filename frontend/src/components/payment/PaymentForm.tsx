import React, { useState, useRef } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { paymentsApi, Payment, Booking } from "../../services/api";

/**
 * Props interface for PaymentForm component
 */
interface PaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string; // default 'USD'
  movieTitle: string;
  onSuccess: (payment: Payment, booking: Booking) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

/**
 * PaymentForm component using @paypal/react-paypal-js
 * Provides PayPal checkout buttons for processing payments
 */
const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingId,
  amount,
  currency = "USD",
  movieTitle,
  onSuccess,
  onError,
  onCancel,
}) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  // Store order ID for cancellation
  const orderIdRef = useRef<string | null>(null);

  // Get PayPal Client ID from environment
  const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;

  // PayPal script options
  const paypalOptions = {
    clientId: paypalClientId || "test",
    currency: currency,
    intent: "capture" as const,
    components: "buttons,card-fields",
  };

  /**
   * Create PayPal order callback
   * Called when user clicks PayPal button
   */
  const createOrder = async (): Promise<string> => {
    try {
      setError(null);
      setIsProcessing(true);

      const response = await paymentsApi.createOrder(bookingId);
      const orderId = response.data.data?.orderId;

      if (!orderId) {
        throw new Error("Failed to create payment order");
      }

      // Store order ID for potential cancellation
      orderIdRef.current = orderId;

      return orderId;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create payment order. Please try again.";
      setError(errorMessage);
      setIsProcessing(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Handle PayPal approval callback
   * Called when user approves payment in PayPal popup
   */
  const handleApprove = async (data: { orderID: string }): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await paymentsApi.capturePayment(data.orderID);

      if (response.data.success && response.data.data) {
        onSuccess(response.data.data.payment, response.data.data.booking);
      } else {
        throw new Error("Payment capture failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Payment processing failed. Please try again.";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle PayPal cancel callback
   * Called when user cancels payment in PayPal popup
   */
  const handleCancel = async (): Promise<void> => {
    try {
      // Cancel the order on backend if it was created
      if (orderIdRef.current) {
        await paymentsApi.cancelPayment(orderIdRef.current);
        orderIdRef.current = null;
      }
    } catch (err) {
      console.error("Failed to cancel payment order:", err);
    } finally {
      setIsProcessing(false);
      onCancel();
    }
  };

  /**
   * Handle PayPal error callback
   * Called when an error occurs during PayPal checkout
   */
  const handleError = (err: Record<string, unknown>): void => {
    console.error("PayPal error:", err);
    const errorMessage = "An error occurred during payment. Please try again.";
    setError(errorMessage);
    setIsProcessing(false);
    onError(errorMessage);
  };

  /**
   * Clear error and retry payment
   */
  const handleRetry = (): void => {
    setError(null);
    orderIdRef.current = null;
  };

  // Show error if PayPal Client ID is missing
  if (!paypalClientId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Payment configuration error
              </h3>
              <p className="mt-1 text-sm text-red-700">
                PayPal is not configured. Please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Payment Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">
          Complete Your Payment
        </h3>
        <p className="text-blue-100 text-sm">{movieTitle}</p>
      </div>

      <div className="p-6">
        {/* Amount Display */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm uppercase tracking-wide">
            Total Amount
          </p>
          <p className="text-4xl font-bold text-gray-900 mt-1">
            {currency} {amount.toFixed(2)}
          </p>
        </div>

        {/* Secure Payment Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 pb-6 border-b border-gray-200">
          <svg
            className="h-5 w-5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-gray-600">
            Secure payment via PayPal
          </span>
          <img
            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg"
            alt="PayPal"
            className="h-5"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl">
              <svg
                className="animate-spin h-12 w-12 text-indigo-600 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-700 font-medium">Processing payment...</p>
              <p className="text-gray-500 text-sm mt-1">
                Please do not close this window
              </p>
            </div>
          </div>
        )}

        {/* PayPal Buttons */}
        <PayPalScriptProvider options={paypalOptions}>
          <div className="relative">
            {/* Loading state for SDK */}
            {!sdkReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <svg
                  className="animate-spin h-8 w-8 text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}

            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "paypal",
              }}
              disabled={isProcessing}
              forceReRender={[amount, currency, bookingId]}
              createOrder={createOrder}
              onApprove={handleApprove}
              onCancel={handleCancel}
              onError={handleError}
              onInit={() => setSdkReady(true)}
            />
          </div>
        </PayPalScriptProvider>

        {/* Payment Methods Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            You can pay using your PayPal account or debit/credit card.
            <br />
            All transactions are secured and encrypted.
          </p>
        </div>

        {/* Cancel Link */}
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel and return
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;

// payment.ts (Member 7)
// PayPal Payment Service - Handles PayPal checkout integration
// Uses @paypal/checkout-server-sdk for order creation, capture, and refunds

import paypal from '@paypal/checkout-server-sdk';
import { env } from '../config/environment';

/* =======================
  PayPal Response Types
======================= */
interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalAmount {
  currency_code: string;
  value: string;
}

interface PayPalCapture {
  id: string;
  status: string;
  amount: PayPalAmount;
}

interface PayPalPayer {
  email_address?: string;
  name?: {
    given_name?: string;
    surname?: string;
  };
}

interface PayPalCard {
  brand?: string;
  last_digits?: string;
}

interface PayPalPaymentSource {
  card?: PayPalCard;
  paypal?: object;
}

interface PayPalOrderResult {
  id: string;
  status: string;
  links: PayPalLink[];
  purchase_units: Array<{
    reference_id: string;
    payments?: {
      captures?: PayPalCapture[];
    };
  }>;
  payer?: PayPalPayer;
  payment_source?: PayPalPaymentSource;
}

interface PayPalRefundResult {
  id: string;
  status: string;
  amount?: PayPalAmount;
}

/* =======================
  Create Order Response
======================= */
export interface CreateOrderResponse {
  orderId: string;
  approvalUrl: string;
}

/* =======================
  Capture Payment Response
======================= */
export interface CapturePaymentResponse {
  success: boolean;
  captureId: string;
  payerEmail: string;
  payerName: string;
  amount: string;
  paymentMethod: 'paypal' | 'card';
  cardDetails?: {
    brand: string;
    lastFour: string;
  };
}

/* =======================
  Refund Response
======================= */
export interface RefundResponse {
  success: boolean;
  refundId: string;
  status: string;
  amount: string;
}

/* =======================
  PayPal Service Class
======================= */
class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    // Initialize PayPal client based on environment
    const clientId = env.PAYPAL_CLIENT_ID;
    const clientSecret = env.PAYPAL_CLIENT_SECRET;

    // Use SandboxEnvironment or LiveEnvironment based on PAYPAL_MODE
    const paypalEnvironment =
      env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

    this.client = new paypal.core.PayPalHttpClient(paypalEnvironment);
  }

  /**
   * Create a PayPal order for the booking
   * @param bookingId - The booking ID
   * @param amount - Amount in USD
   * @param description - Order description (movie title, cinema, showtime)
   * @returns PayPal order ID and approval URL
   */
  async createOrder(
    bookingId: string,
    amount: number,
    description: string
  ): Promise<CreateOrderResponse> {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: bookingId,
          description: description,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'CineBook',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${env.FRONTEND_URL}/payment/success`,
        cancel_url: `${env.FRONTEND_URL}/payment/cancel`,
      },
    });

    const response = await this.client.execute(request);
    const result = response.result as PayPalOrderResult;

    const approvalUrl = result.links.find(
      (link: PayPalLink) => link.rel === 'approve'
    )?.href;

    return {
      orderId: result.id,
      approvalUrl: approvalUrl || '',
    };
  }

  /**
   * Capture payment after user approval
   * @param orderId - PayPal order ID
   * @returns Capture details including transaction ID and payer info
   */
  async capturePayment(orderId: string): Promise<CapturePaymentResponse> {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const response = await this.client.execute(request);
    const result = response.result as PayPalOrderResult;

    const capture = result.purchase_units[0]?.payments?.captures?.[0];
    const payer = result.payer;
    const paymentSource = result.payment_source;

    // Determine if paid via PayPal or card
    let paymentMethod: 'paypal' | 'card' = 'paypal';
    let cardDetails: { brand: string; lastFour: string } | undefined;

    if (paymentSource?.card) {
      paymentMethod = 'card';
      cardDetails = {
        brand: paymentSource.card.brand || '',
        lastFour: paymentSource.card.last_digits || '',
      };
    }

    return {
      success: result.status === 'COMPLETED',
      captureId: capture?.id || '',
      payerEmail: payer?.email_address || '',
      payerName:
        `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim(),
      amount: capture?.amount?.value || '0',
      paymentMethod,
      cardDetails,
    };
  }

  /**
   * Process refund for a captured payment
   * @param captureId - PayPal capture ID
   * @param amount - Amount to refund (optional, full refund if not specified)
   * @returns Refund details
   */
  async processRefund(captureId: string, amount?: number): Promise<RefundResponse> {
    const request = new paypal.payments.CapturesRefundRequest(captureId);

    if (amount) {
      request.requestBody({
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
      });
    } else {
      request.requestBody({});
    }

    const response = await this.client.execute(request);
    const result = response.result as PayPalRefundResult;

    return {
      success: result.status === 'COMPLETED',
      refundId: result.id,
      status: result.status,
      amount: result.amount?.value || '0',
    };
  }

  /**
   * Get order details from PayPal
   * @param orderId - PayPal order ID
   * @returns Order details
   */
  async getOrderDetails(orderId: string): Promise<PayPalOrderResult> {
    const request = new paypal.orders.OrdersGetRequest(orderId);
    const response = await this.client.execute(request);
    return response.result as PayPalOrderResult;
  }
}

/* =======================
  Export Singleton Instance
======================= */
export const paypalService = new PayPalService();
export default paypalService;

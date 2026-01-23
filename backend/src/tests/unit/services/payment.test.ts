// payment.test.ts - Unit tests for PayPal payment service

// Mock the PayPal SDK before importing the service
jest.mock('@paypal/checkout-server-sdk', () => {
  const mockExecute = jest.fn();

  return {
    core: {
      PayPalHttpClient: jest.fn().mockImplementation(() => ({
        execute: mockExecute,
      })),
      SandboxEnvironment: jest.fn(),
      LiveEnvironment: jest.fn(),
    },
    orders: {
      OrdersCreateRequest: jest.fn().mockImplementation(() => ({
        prefer: jest.fn(),
        requestBody: jest.fn(),
      })),
      OrdersCaptureRequest: jest.fn().mockImplementation(() => ({
        requestBody: jest.fn(),
      })),
      OrdersGetRequest: jest.fn(),
    },
    payments: {
      CapturesRefundRequest: jest.fn().mockImplementation(() => ({
        requestBody: jest.fn(),
      })),
    },
    __mockExecute: mockExecute,
  };
});

// Mock environment config
jest.mock('../../../config/environment', () => ({
  env: {
    PAYPAL_CLIENT_ID: 'test-client-id',
    PAYPAL_CLIENT_SECRET: 'test-client-secret',
    PAYPAL_MODE: 'sandbox',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

import paypal from '@paypal/checkout-server-sdk';
import { paypalService } from '../../../services/payment';

// Get the mock execute function
const mockExecute = (paypal as any).__mockExecute;

describe('PayPal Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a PayPal order successfully', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-123',
          status: 'CREATED',
          links: [
            { href: 'https://api.paypal.com/orders/ORDER-123', rel: 'self' },
            {
              href: 'https://paypal.com/checkoutnow?token=ORDER-123',
              rel: 'approve',
            },
          ],
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.createOrder(
        'booking-123',
        25.0,
        'Test Movie - Cinema One - 7:00 PM'
      );

      expect(result).toEqual({
        orderId: 'ORDER-123',
        approvalUrl: 'https://paypal.com/checkoutnow?token=ORDER-123',
      });
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should handle missing approval URL', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-456',
          status: 'CREATED',
          links: [
            { href: 'https://api.paypal.com/orders/ORDER-456', rel: 'self' },
          ],
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.createOrder(
        'booking-456',
        50.0,
        'Another Movie'
      );

      expect(result).toEqual({
        orderId: 'ORDER-456',
        approvalUrl: '',
      });
    });

    it('should throw error when PayPal API fails', async () => {
      mockExecute.mockRejectedValueOnce(new Error('PayPal API Error'));

      await expect(
        paypalService.createOrder('booking-789', 30.0, 'Test Movie')
      ).rejects.toThrow('PayPal API Error');
    });
  });

  describe('capturePayment', () => {
    it('should capture payment successfully with PayPal', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-123',
          status: 'COMPLETED',
          purchase_units: [
            {
              reference_id: 'booking-123',
              payments: {
                captures: [
                  {
                    id: 'CAPTURE-123',
                    status: 'COMPLETED',
                    amount: { currency_code: 'USD', value: '25.00' },
                  },
                ],
              },
            },
          ],
          payer: {
            email_address: 'buyer@example.com',
            name: { given_name: 'John', surname: 'Doe' },
          },
          payment_source: {
            paypal: {},
          },
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.capturePayment('ORDER-123');

      expect(result).toEqual({
        success: true,
        captureId: 'CAPTURE-123',
        payerEmail: 'buyer@example.com',
        payerName: 'John Doe',
        amount: '25.00',
        paymentMethod: 'paypal',
        cardDetails: undefined,
      });
    });

    it('should capture payment successfully with card', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-456',
          status: 'COMPLETED',
          purchase_units: [
            {
              reference_id: 'booking-456',
              payments: {
                captures: [
                  {
                    id: 'CAPTURE-456',
                    status: 'COMPLETED',
                    amount: { currency_code: 'USD', value: '50.00' },
                  },
                ],
              },
            },
          ],
          payer: {
            email_address: 'cardholder@example.com',
            name: { given_name: 'Jane', surname: 'Smith' },
          },
          payment_source: {
            card: {
              brand: 'VISA',
              last_digits: '1234',
            },
          },
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.capturePayment('ORDER-456');

      expect(result).toEqual({
        success: true,
        captureId: 'CAPTURE-456',
        payerEmail: 'cardholder@example.com',
        payerName: 'Jane Smith',
        amount: '50.00',
        paymentMethod: 'card',
        cardDetails: {
          brand: 'VISA',
          lastFour: '1234',
        },
      });
    });

    it('should handle incomplete payment', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-789',
          status: 'PENDING',
          purchase_units: [
            {
              reference_id: 'booking-789',
              payments: {
                captures: [
                  {
                    id: 'CAPTURE-789',
                    status: 'PENDING',
                    amount: { currency_code: 'USD', value: '30.00' },
                  },
                ],
              },
            },
          ],
          payer: {},
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.capturePayment('ORDER-789');

      expect(result.success).toBe(false);
      expect(result.captureId).toBe('CAPTURE-789');
    });

    it('should handle missing payer info', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-ABC',
          status: 'COMPLETED',
          purchase_units: [
            {
              reference_id: 'booking-ABC',
              payments: {
                captures: [
                  {
                    id: 'CAPTURE-ABC',
                    status: 'COMPLETED',
                    amount: { currency_code: 'USD', value: '40.00' },
                  },
                ],
              },
            },
          ],
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.capturePayment('ORDER-ABC');

      expect(result).toEqual({
        success: true,
        captureId: 'CAPTURE-ABC',
        payerEmail: '',
        payerName: '',
        amount: '40.00',
        paymentMethod: 'paypal',
        cardDetails: undefined,
      });
    });

    it('should handle missing capture details', async () => {
      const mockResponse = {
        result: {
          id: 'ORDER-XYZ',
          status: 'COMPLETED',
          purchase_units: [
            {
              reference_id: 'booking-XYZ',
            },
          ],
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.capturePayment('ORDER-XYZ');

      expect(result.captureId).toBe('');
      expect(result.amount).toBe('0');
    });
  });

  describe('processRefund', () => {
    it('should process full refund successfully', async () => {
      const mockResponse = {
        result: {
          id: 'REFUND-123',
          status: 'COMPLETED',
          amount: { currency_code: 'USD', value: '25.00' },
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.processRefund('CAPTURE-123');

      expect(result).toEqual({
        success: true,
        refundId: 'REFUND-123',
        status: 'COMPLETED',
        amount: '25.00',
      });
    });

    it('should process partial refund successfully', async () => {
      const mockResponse = {
        result: {
          id: 'REFUND-456',
          status: 'COMPLETED',
          amount: { currency_code: 'USD', value: '10.00' },
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.processRefund('CAPTURE-456', 10.0);

      expect(result).toEqual({
        success: true,
        refundId: 'REFUND-456',
        status: 'COMPLETED',
        amount: '10.00',
      });
    });

    it('should handle pending refund', async () => {
      const mockResponse = {
        result: {
          id: 'REFUND-789',
          status: 'PENDING',
        },
      };

      mockExecute.mockResolvedValueOnce(mockResponse);

      const result = await paypalService.processRefund('CAPTURE-789');

      expect(result).toEqual({
        success: false,
        refundId: 'REFUND-789',
        status: 'PENDING',
        amount: '0',
      });
    });

    it('should throw error when refund fails', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Refund failed'));

      await expect(
        paypalService.processRefund('CAPTURE-INVALID')
      ).rejects.toThrow('Refund failed');
    });
  });

  describe('getOrderDetails', () => {
    it('should retrieve order details successfully', async () => {
      const mockOrderDetails = {
        id: 'ORDER-123',
        status: 'COMPLETED',
        purchase_units: [
          {
            reference_id: 'booking-123',
            amount: { currency_code: 'USD', value: '25.00' },
          },
        ],
        links: [],
      };

      mockExecute.mockResolvedValueOnce({ result: mockOrderDetails });

      const result = await paypalService.getOrderDetails('ORDER-123');

      expect(result).toEqual(mockOrderDetails);
    });

    it('should throw error for invalid order ID', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Order not found'));

      await expect(
        paypalService.getOrderDetails('INVALID-ORDER')
      ).rejects.toThrow('Order not found');
    });
  });
});

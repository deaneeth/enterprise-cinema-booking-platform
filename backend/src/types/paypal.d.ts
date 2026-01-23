// paypal.d.ts (Member 7)
// Type declarations for @paypal/checkout-server-sdk
// This module doesn't have official TypeScript types
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }

    class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment);
      execute<T = any>(request: any): Promise<{ result: T; statusCode: number }>;
    }
  }

  export namespace orders {
    class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: OrdersCreateRequestBody): void;
    }

    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: object): void;
    }

    class OrdersGetRequest {
      constructor(orderId: string);
    }

    interface OrdersCreateRequestBody {
      intent: 'CAPTURE' | 'AUTHORIZE';
      purchase_units: PurchaseUnit[];
      application_context?: ApplicationContext;
    }

    interface PurchaseUnit {
      reference_id?: string;
      description?: string;
      amount: {
        currency_code: string;
        value: string;
      };
    }

    interface ApplicationContext {
      brand_name?: string;
      landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
      user_action?: 'CONTINUE' | 'PAY_NOW';
      return_url?: string;
      cancel_url?: string;
    }
  }

  export namespace payments {
    class CapturesRefundRequest {
      constructor(captureId: string);
      requestBody(body: RefundRequestBody): void;
    }

    interface RefundRequestBody {
      amount?: {
        currency_code: string;
        value: string;
      };
    }
  }
}

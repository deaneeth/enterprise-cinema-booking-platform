import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    field?: string;
    details?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get API base URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Create configured Axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

/**
 * Request interceptor
 * Automatically adds Authorization header with token from localStorage
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError): Promise<never> => {
    console.error("Request error:", error);
    return Promise.reject(error);
  },
);

/**
 * Callback function for handling 401 redirects
 * This allows the app to provide a custom navigation handler
 */
let unauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void): void => {
  unauthorizedCallback = callback;
};

/**
 * Response interceptor
 * Handles 401 errors by clearing token and redirecting to login
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>): Promise<never> => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear token from localStorage
        localStorage.removeItem("token");

        // Use callback if available, otherwise fall back to window.location
        if (unauthorizedCallback) {
          unauthorizedCallback();
        } else if (window.location.pathname !== "/login") {
          // Fallback to window.location for backwards compatibility
          window.location.href = "/login";
        }
      }

      // Log error for debugging
      console.error("API Error:", {
        status,
        message: data?.error?.message || error.message,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Network error
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  },
);

/**
 * Helper function to extract error message from API response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    return (
      axiosError.response?.data?.error?.message ||
      axiosError.message ||
      "An error occurred"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

/**
 * Auth API endpoints
 */
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: any; token: string }>>("/api/auth/login", {
      email,
      password,
    }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) =>
    api.post<ApiResponse<{ user: any; token: string }>>(
      "/api/auth/register",
      data,
    ),

  getMe: () => api.get<ApiResponse<{ user: any }>>("/api/auth/me"),

  logout: () => api.post<ApiResponse>("/api/auth/logout"),
};

/**
 * Users API endpoints
 */
export const usersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
  }) => api.get<ApiResponse>("/api/users", { params }),

  getById: (id: string) => api.get<ApiResponse>(`/api/users/${id}`),

  update: (
    id: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) => api.put<ApiResponse>(`/api/users/${id}`, data),

  changePassword: (
    id: string,
    data: { currentPassword: string; newPassword: string },
  ) => api.put<ApiResponse>(`/api/users/${id}/change-password`, data),

  deactivate: (id: string) => api.delete<ApiResponse>(`/api/users/${id}`),
};

/**
 * Bookings API endpoints
 */
export const bookingsApi = {
  // Create a new booking
  create: (data: { showtimeId: string; seatIds: string[] }) =>
    api.post<ApiResponse>("/api/bookings", data),

  // Update booking seats without extending hold
  updateSeats: (bookingId: string, seatIds: string[]) =>
    api.put<ApiResponse>(`/api/bookings/${bookingId}/seats`, { seatIds }),

  // Confirm a booking after payment
  confirm: (bookingId: string, paymentId?: string) =>
    api.post<ApiResponse>(`/api/bookings/${bookingId}/confirm`, { paymentId }),

  // Get a specific booking by ID
  getById: (bookingId: string) =>
    api.get<ApiResponse>(`/api/bookings/${bookingId}`),

  // Get current user's bookings
  getMyBookings: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse>("/api/users/me/bookings", { params }),

  // Cancel a booking
  cancel: (bookingId: string) =>
    api.delete<ApiResponse>(`/api/bookings/${bookingId}`),

  // Admin: Get all bookings
  getAll: (params?: {
    userId?: string;
    showtimeId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse>("/api/bookings", { params }),
};

/* =======================
  Payment Types (Member 7)
======================= */

/**
 * Payment interface for PayPal transactions
 */
export interface Payment {
  _id: string;
  bookingId: string | Booking;
  userId: string | User;
  amount: number;
  currency: string;
  paymentMethod: "paypal" | "card";
  paymentStatus: "pending" | "completed" | "failed" | "refunded" | "cancelled";
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  payerEmail?: string;
  payerName?: string;
  paymentDate?: string;
  refundDate?: string;
  paymentDetails?: {
    cardBrand?: string;
    cardLastFour?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Booking interface for type safety
 */
export interface Booking {
  _id: string;
  userId: string | User;
  showtimeId: string | Showtime;
  seatIds: string[];
  numberOfSeats: number;
  totalAmount: number;
  bookingStatus: "pending" | "confirmed" | "cancelled";
  bookingDate: string;
  paymentId?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User interface for type safety
 */
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "cinema_admin" | "platform_admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Showtime interface for type safety
 */
export interface Showtime {
  _id: string;
  movieId: string | Movie;
  cinemaId: string | Cinema;
  screenNumber: number;
  startTime: string;
  endTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Movie interface for type safety
 */
export interface Movie {
  _id: string;
  title: string;
  posterUrl?: string;
  duration: number;
  rating?: string;
  genre?: string[];
}

/**
 * Cinema interface for type safety
 */
export interface Cinema {
  _id: string;
  name: string;
  location: string;
}

/* =======================
  Payments API (Member 7)
======================= */

/**
 * Payments API endpoints for PayPal integration
 */
export const paymentsApi = {
  /**
   * Create a PayPal order for a pending booking
   * @param bookingId - The booking ID to create payment for
   * @returns PayPal order ID and approval URL
   */
  createOrder: (bookingId: string) =>
    api.post<ApiResponse<{ orderId: string; approvalUrl: string }>>(
      "/api/payments/create-order",
      { bookingId },
    ),

  /**
   * Capture payment after user approves in PayPal
   * @param orderId - PayPal order ID from createOrder
   * @returns Payment and booking details
   */
  capturePayment: (orderId: string) =>
    api.post<
      ApiResponse<{ success: boolean; payment: Payment; booking: Booking }>
    >("/api/payments/capture", { orderId }),

  /**
   * Cancel a pending payment (user cancelled in PayPal)
   * @param orderId - PayPal order ID to cancel
   */
  cancelPayment: (orderId: string) =>
    api.post<ApiResponse<{ message: string }>>("/api/payments/cancel", {
      orderId,
    }),

  /**
   * Get current user's payment history
   * @returns Array of payments with populated booking details
   */
  getMyPayments: () =>
    api.get<ApiResponse<Payment[]>>("/api/payments/my-payments"),

  /**
   * Get a specific payment by ID
   * @param id - Payment ID
   * @returns Payment with all populated relations
   */
  getPaymentById: (id: string) =>
    api.get<ApiResponse<Payment>>(`/api/payments/${id}`),

  /**
   * Process refund for a completed payment
   * @param paymentId - Payment ID to refund
   * @returns Refund confirmation details
   */
  processRefund: (paymentId: string) =>
    api.post<
      ApiResponse<{ payment: Payment; refundId: string; refundAmount: string }>
    >(`/api/payments/${paymentId}/refund`),

  /**
   * Get all payments (Admin only)
   * @param params - Filter and pagination parameters
   * @returns Paginated payments list
   */
  getAllPayments: (params?: {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<
      ApiResponse<{
        payments: Payment[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>
    >("/api/payments", { params }),
};

export default api;

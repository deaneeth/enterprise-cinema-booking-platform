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
  }
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
  }
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
      data
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
    data: { firstName?: string; lastName?: string; phone?: string }
  ) => api.put<ApiResponse>(`/api/users/${id}`, data),

  changePassword: (
    id: string,
    data: { currentPassword: string; newPassword: string }
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

export default api;

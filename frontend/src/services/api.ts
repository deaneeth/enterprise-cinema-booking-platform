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

        // Redirect to login page (only if not already on login page)
        if (window.location.pathname !== "/login") {
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
    api.post<ApiResponse>("/api/auth/login", { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post<ApiResponse>("/api/auth/register", data),

  getMe: () => api.get<ApiResponse>("/api/auth/me"),

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

export default api;

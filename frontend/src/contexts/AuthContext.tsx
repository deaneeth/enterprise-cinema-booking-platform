import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, getErrorMessage } from "../services/api";

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "cinema_admin" | "platform_admin";
  isActive: boolean;
  createdAt?: string;
}

// Registration data  interface
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Auth context interface
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Manages authentication state for the entire application
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = currentUser !== null;

  /**
   * Load user from token on mount
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch user data from API using axios
        const response = await authApi.getMe();

        if (response.data.success && response.data.data?.user) {
          setCurrentUser(response.data.data.user);
        } else {
          // Invalid response, clear token
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login function
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login(email, password);

      if (response.data.success && response.data.data?.token && response.data.data?.user) {
        localStorage.setItem("token", response.data.data.token);
        setCurrentUser(response.data.data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(getErrorMessage(error));
    }
  };

  /**
   * Register function
   */
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await authApi.register(userData);

      if (response.data.success && response.data.data?.token && response.data.data?.user) {
        localStorage.setItem("token", response.data.data.token);
        setCurrentUser(response.data.data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(getErrorMessage(error));
    }
  };

  /**
   * Logout function
   */
  const logout = (): void => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  /**
   * Update user data
   */
  const updateUser = (user: User): void => {
    setCurrentUser(user);
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;

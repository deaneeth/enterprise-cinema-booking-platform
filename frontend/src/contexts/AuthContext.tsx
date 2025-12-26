import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "user" | "cinema_admin" | "platform_admin";
  isActive: boolean;
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

        // Fetch user data from API
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.user) {
            setCurrentUser(data.data.user);
          } else {
            // Invalid response, clear token
            localStorage.removeItem("token");
          }
        } else {
          // Token invalid or expired, clear it
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Login failed");
      }

      if (data.success && data.data.token && data.data.user) {
        localStorage.setItem("token", data.data.token);
        setCurrentUser(data.data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  /**
   * Register function
   */
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      if (data.success && data.data.token && data.data.user) {
        localStorage.setItem("token", data.data.token);
        setCurrentUser(data.data.user);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
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

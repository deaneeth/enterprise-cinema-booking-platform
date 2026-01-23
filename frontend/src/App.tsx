// App.tsx
// Main application component that sets up routing and global providers
// This is the root component of the React application
//
// =============================================================================
// IMPORTANT: ALL TEAM MEMBERS MUST ADD THEIR ROUTES HERE
// =============================================================================
// Each member should add their routes in the designated section below.
// Follow the existing pattern and add comments with your member number.
//
// Route adding instructions:
// 1. Import your page components at the top
// 2. Add your routes in the Routes section with your member comment
// 3. Use ProtectedRoute wrapper for authenticated routes
// 4. Run TypeScript check: npx tsc --noEmit
// =============================================================================

import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { setUnauthorizedCallback } from "./services/api";

// Auth Components (Member 1)
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Page Components (Member 1)
import Profile from "./pages/Profile";

// =============================================================================
// TODO: OTHER MEMBERS - Import your page components below
// =============================================================================
// Member 2 (Cinemas): import CinemasPage from './pages/Cinemas';
// Member 3 (Movies): import MoviesPage from './pages/Movies';
// Member 4 (Showtimes): import ShowtimesPage from './pages/Showtimes';

// import Showtimes from "./pages/MovieDetail";
// import Showtime from "./pages/";

// Member 5 (Bookings): Booking page route import
import Booking from "./pages/Booking";
import { BookingProvider } from "./contexts/BookingContext";

// Member 7 (Payments): Payment page route import
import Payment from "./pages/Payment";

// =============================================================================

// Member 2 (Cinemas): Cinemas page route import
import Cinemas from "./pages/Cinemas";
import CinemaDetail from "./components/cinemas/CinemaDetail";

//Member 3 (Movies): Movies page route import
import Movies from "./pages/Movies";
import MovieDetail from "./components/movies/MovieDetail";

// Common Layout Components
//Navbar component (route)
import Navbar from "./components/common/Navbar";
// Footer component (route)
import Footer from "./components/common/Footer";

/**
 * Router component that sets up navigation callback
 */
const AppRouter: React.FC = () => {
  const navigate = useNavigate();

  // Set up unauthorized callback to use React Router navigation
  useEffect(() => {
    setUnauthorizedCallback(() => {
      if (window.location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-100">
        <Routes>
          {/* ============================================================= */}
          {/* PUBLIC ROUTES - No authentication required */}
          {/* ============================================================= */}

          {/* Member 1: Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* TODO: Member 3 (Movies) - Add public movie browsing routes */}
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />

          {/* <Route path="/movies" element={<MoviesPage />} /> */}
          {/* <Route path="/movies/:id" element={<MovieDetailPage />} /> */}

          {/* Member 2 (Cinemas) - Cinema browsing routes */}
          <Route path="/cinemas" element={<Cinemas />} />
          <Route path="/cinemas/:id" element={<CinemaDetail />} />

          {/* ============================================================= */}
          {/* PROTECTED ROUTES - Authentication required */}
          {/* ============================================================= */}

          {/* Member 1: Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Member 5 (Bookings) - Booking route */}
          <Route
            path="/booking/:showtimeId"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />

          {/* Member 7 (Payments) - Payment route */}
          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />

          {/* ============================================================= */}
          {/* ADMIN ROUTES - Admin role required */}
          {/* ============================================================= */}

          {/* TODO: Member 2 (Cinemas) - Add cinema admin routes */}
          {/* <Route path="/admin/cinemas" element={<ProtectedRoute allowedRoles={["cinema_admin"]}><CinemaAdminPage /></ProtectedRoute>} /> */}

          {/* TODO: Member 4 (Showtimes) - Add showtime management routes */}
          {/* <Route path="/admin/showtimes" element={<ProtectedRoute allowedRoles={["cinema_admin"]}><ShowtimeAdminPage /></ProtectedRoute>} /> */}

          {/* ============================================================= */}
          {/* DEFAULT ROUTES */}
          {/* ============================================================= */}

          {/* Home page - redirect to login or movies page */}
          {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
          <Route path="/" element={<Navigate to="/movies" replace />} />

          {/* 404 - Catch all unmatched routes */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page not found</p>
                  <Link
                    // to="/login"
                    to="/movies"
                    className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {/* Go Home */}
                    Browse Movies
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;

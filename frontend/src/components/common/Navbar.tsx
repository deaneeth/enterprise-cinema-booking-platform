// import React from "react";
// import { Link } from "react-router-dom";

// const Navbar: React.FC = () => {
//   return (
//     <header className="border-b border-gray-200 bg-white">
//       <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
//         <Link to="/" className="text-lg font-semibold text-gray-900">
//           Cinema Booking
//         </Link>
//         <nav className="flex items-center gap-4 text-sm">
//           <Link to="/cinemas" className="text-gray-700 hover:text-gray-900">
//             Cinemas
//           </Link>
//           <Link to="/profile" className="text-gray-700 hover:text-gray-900">
//             Profile
//           </Link>
//           <Link
//             to="/login"
//             className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
//           >
//             Login
//           </Link>
//         </nav>
//       </div>
//     </header>
//   );
// };

// export default Navbar;

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "./Button";

const Navbar: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "";

  return (
    <header className="sticky top-0 z-50 bg-gray-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((s) => !s)}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  mobileOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>

          <Link to="/" className="text-lg font-semibold text-white">
            Cinema Booking
          </Link>
        </div>

        <nav className="hidden md:flex md:items-center md:gap-6">
          <Link to="/" className="text-sm text-gray-200 hover:text-white">
            Home
          </Link>
          <Link to="/movies" className="text-sm text-gray-200 hover:text-white">
            Movies
          </Link>
          <Link
            to="/cinemas"
            className="text-sm text-gray-200 hover:text-white"
          >
            Cinemas
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-1 text-sm"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <span className="truncate max-w-[10rem]">
                  {displayName || "User"}
                </span>
                <svg
                  className="h-4 w-4 text-gray-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.656a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white text-gray-900 shadow-lg">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/bookings"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Bookings
                  </Link>
                  <div className="px-4 py-2">
                    <Button
                      variant="secondary"
                      className="w-full text-left"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex md:items-center md:gap-2">
              <Link
                to="/login"
                className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md border border-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <Link to="/" className="text-sm text-gray-200">
              Home
            </Link>
            <Link to="/movies" className="text-sm text-gray-200">
              Movies
            </Link>
            <Link to="/cinemas" className="text-sm text-gray-200">
              Cinemas
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="text-sm text-gray-200">
                  Profile
                </Link>
                <Link to="/bookings" className="text-sm text-gray-200">
                  Bookings
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="text-left text-sm text-gray-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md border border-indigo-600 px-3 py-1 text-sm text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

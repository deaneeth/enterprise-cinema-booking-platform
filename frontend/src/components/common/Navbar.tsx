import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          Cinema Booking
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/cinemas" className="text-gray-700 hover:text-gray-900">
            Cinemas
          </Link>
          <Link to="/profile" className="text-gray-700 hover:text-gray-900">
            Profile
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

// AdminLayout.tsx (Phase 3 - Admin Dashboards)
// Shared layout component for all admin pages
// Includes sidebar navigation and content area
// Updated with dark theme to match the rest of the application

import React, { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define navigation items based on role
  const getNavItems = (): NavItem[] => {
    if (currentUser?.role === "platform_admin") {
      return [
        { label: "Overview", path: "/admin", icon: "📊" },
        { label: "Movies", path: "/admin/movies", icon: "🎬" },
        { label: "Cinemas", path: "/admin/cinemas", icon: "🏢" },
        { label: "Users", path: "/admin/users", icon: "👥" },
        { label: "Applications", path: "/admin/applications", icon: "📋" },
      ];
    } else if (currentUser?.role === "cinema_admin") {
      return [
        { label: "Overview", path: "/admin/cinema", icon: "📊" },
        { label: "Showtimes", path: "/admin/cinema/showtimes", icon: "🕐" },
        { label: "Bookings", path: "/admin/cinema/bookings", icon: "🎟️" },
        { label: "Settings", path: "/admin/cinema/settings", icon: "⚙️" },
      ];
    }
    return [];
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-16 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-[#0f0f1a] border-r border-white/10 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              Cine<span className="text-red-500">Flick</span>
            </span>
          </Link>
          <div className="mt-2 text-sm text-gray-400">
            {currentUser?.role === "platform_admin"
              ? "👑 Platform Admin"
              : "🎬 Cinema Admin"}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-red-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="mb-3 px-4">
            <div className="text-sm font-medium text-white truncate">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {currentUser?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
              )}
            </div>
            <Link
              to="/"
              className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              ← Back to Site
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;

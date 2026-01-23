// PlatformDashboard.tsx (Phase 3.3 - Platform Admin Dashboard)
// Main overview page for platform administrators
// Shows key stats, recent activity, and quick actions

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface DashboardStats {
  totalUsers: number;
  totalMovies: number;
  totalCinemas: number;
  totalBookings: number;
  pendingApplications: number;
  todayBookings: number;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
  link?: string;
}> = ({ label, value, icon, color, link }) => {
  const content = (
    <div
      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className="text-4xl opacity-80 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

const PlatformDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats from multiple endpoints
        const [usersRes, moviesRes, cinemasRes, bookingsRes] =
          await Promise.all([
            api.get("/api/users").catch(() => ({ data: { data: [] } })),
            api.get("/api/movies").catch(() => ({ data: { data: [] } })),
            api
              .get("/api/cinemas")
              .catch(() => ({ data: { data: { cinemas: [] } } })),
            api.get("/api/bookings").catch(() => ({ data: { data: [] } })),
          ]);

        // Extract counts
        const usersData = usersRes.data?.data;
        const moviesData = moviesRes.data?.data;
        const cinemasData = cinemasRes.data?.data;
        const bookingsData = bookingsRes.data?.data;

        const userCount = Array.isArray(usersData) ? usersData.length : 0;
        const movieCount = Array.isArray(moviesData) ? moviesData.length : 0;
        const cinemaCount =
          cinemasData?.cinemas?.length ||
          (Array.isArray(cinemasData) ? cinemasData.length : 0);
        const bookingList = Array.isArray(bookingsData) ? bookingsData : [];

        // Calculate today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = bookingList.filter((b: any) => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= today;
        }).length;

        setStats({
          totalUsers: userCount,
          totalMovies: movieCount,
          totalCinemas: cinemaCount,
          totalBookings: bookingList.length,
          pendingApplications: 0, // Will be implemented later
          todayBookings,
        });

        // Get recent bookings
        setRecentBookings(bookingList.slice(0, 5));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Platform Dashboard" subtitle="Loading...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-white/10 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Platform Dashboard"
        subtitle="Error loading dashboard"
      >
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Platform Dashboard" subtitle="Welcome back, Admin">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="text-blue-600"
          link="/admin/users"
        />
        <StatCard
          label="Total Movies"
          value={stats?.totalMovies || 0}
          icon="🎬"
          color="text-purple-600"
          link="/admin/movies"
        />
        <StatCard
          label="Total Cinemas"
          value={stats?.totalCinemas || 0}
          icon="🏢"
          color="text-green-600"
          link="/admin/cinemas"
        />
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings || 0}
          icon="🎟️"
          color="text-orange-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          label="Today's Bookings"
          value={stats?.todayBookings || 0}
          icon="📅"
          color="text-indigo-600"
        />
        <StatCard
          label="Pending Applications"
          value={stats?.pendingApplications || 0}
          icon="📋"
          color="text-yellow-600"
          link="/admin/applications"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/movies"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            + Add Movie
          </Link>
          <Link
            to="/admin/cinemas"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            + Add Cinema
          </Link>
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
          >
            View Users
          </Link>
          <Link
            to="/admin/applications"
            className="px-4 py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600/30 transition-colors text-sm font-medium border border-amber-500/30"
          >
            Review Applications
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Bookings
        </h2>
        {recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 font-medium text-gray-400">
                    ID
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">
                    Amount
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-2 font-mono text-xs text-gray-300">
                      #{booking._id?.slice(-8) || "N/A"}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : booking.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-white/10 text-gray-400 border border-white/10"
                        }`}
                      >
                        {booking.status || "unknown"}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-white">
                      ${(booking.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-gray-400">
                      {booking.createdAt
                        ? new Date(booking.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No bookings found</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default PlatformDashboard;

// CinemaAdminDashboard.tsx - Cinema Admin Dashboard with proper cinema scoping
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface CinemaStats {
  todayShowtimes: number;
  todayBookings: number;
  totalBookings: number;
  upcomingShowtimes: number;
  cinemaName: string;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 group">
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

const CinemaAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<CinemaStats | null>(null);
  const [todayShowtimes, setTodayShowtimes] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the user's assigned cinema
  const userCinemaId = currentUser?.cinemaId;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if cinema admin has a cinema assigned
        if (!userCinemaId) {
          setStats({
            todayShowtimes: 0,
            todayBookings: 0,
            totalBookings: 0,
            upcomingShowtimes: 0,
            cinemaName: "No Cinema Assigned",
          });
          setLoading(false);
          return;
        }

        // Fetch all data
        const [showtimesRes, bookingsRes, cinemaRes] = await Promise.all([
          api.get("/api/showtimes").catch(() => ({ data: { data: [] } })),
          api.get("/api/bookings").catch(() => ({ data: { data: [] } })),
          api
            .get(`/api/cinemas/${userCinemaId}`)
            .catch(() => ({ data: { data: null } })),
        ]);

        const allShowtimes = showtimesRes.data?.data || [];
        const allBookings = bookingsRes.data?.data || [];
        const cinema =
          cinemaRes.data?.data?.cinema || cinemaRes.data?.data || null;

        // Filter showtimes by this cinema
        const cinemaShowtimes = Array.isArray(allShowtimes)
          ? allShowtimes.filter((s: any) => {
              const showtimeCinemaId =
                typeof s.cinemaId === "object" ? s.cinemaId._id : s.cinemaId;
              return showtimeCinemaId === userCinemaId;
            })
          : [];

        // Filter bookings by this cinema's showtimes
        const cinemaShowtimeIds = new Set(
          cinemaShowtimes.map((s: any) => s._id),
        );
        const cinemaBookings = Array.isArray(allBookings)
          ? allBookings.filter((b: any) => {
              const bookingShowtimeId =
                typeof b.showtimeId === "object"
                  ? b.showtimeId._id
                  : b.showtimeId;
              return cinemaShowtimeIds.has(bookingShowtimeId);
            })
          : [];

        // Calculate today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Filter today's showtimes
        const todayShowtimesList = cinemaShowtimes.filter((s: any) => {
          const showDate = new Date(s.startTime);
          return showDate >= today && showDate < tomorrow;
        });

        // Filter today's bookings
        const todayBookingsCount = cinemaBookings.filter((b: any) => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= today;
        }).length;

        // Count upcoming showtimes
        const upcomingShowtimes = cinemaShowtimes.filter(
          (s: any) => new Date(s.startTime) >= today,
        ).length;

        setStats({
          todayShowtimes: todayShowtimesList.length,
          todayBookings: todayBookingsCount,
          totalBookings: cinemaBookings.length,
          upcomingShowtimes,
          cinemaName: cinema?.name || "Your Cinema",
        });

        setTodayShowtimes(todayShowtimesList.slice(0, 5));
        setRecentBookings(cinemaBookings.slice(0, 5));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, userCinemaId]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show message if no cinema assigned
  if (!userCinemaId && !loading) {
    return (
      <AdminLayout title="Cinema Dashboard" subtitle="No cinema assigned">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-amber-400 mb-2">
            No Cinema Assigned
          </h2>
          <p className="text-amber-300/80">
            You haven't been assigned to a cinema yet. Please contact a platform
            administrator.
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Cinema Dashboard" subtitle="Loading...">
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
      <AdminLayout title="Cinema Dashboard" subtitle="Error loading dashboard">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Cinema Dashboard"
      subtitle={`Managing: ${stats?.cinemaName || "Your Cinema"}`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Today's Showtimes"
          value={stats?.todayShowtimes || 0}
          icon="🕐"
          color="text-blue-600"
        />
        <StatCard
          label="Today's Bookings"
          value={stats?.todayBookings || 0}
          icon="🎟️"
          color="text-green-600"
        />
        <StatCard
          label="Upcoming Showtimes"
          value={stats?.upcomingShowtimes || 0}
          icon="📅"
          color="text-purple-600"
        />
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings || 0}
          icon="📊"
          color="text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/cinema/showtimes"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            + Add Showtime
          </Link>
          <Link
            to="/admin/cinema/bookings"
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
          >
            View All Bookings
          </Link>
          <Link
            to="/admin/cinema/settings"
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-medium border border-white/10"
          >
            Cinema Settings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Showtimes */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Today's Showtimes
            </h2>
            <Link
              to="/admin/cinema/showtimes"
              className="text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              View All →
            </Link>
          </div>
          {todayShowtimes.length > 0 ? (
            <div className="space-y-3">
              {todayShowtimes.map((showtime) => (
                <div
                  key={showtime._id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">
                      {showtime.movieId?.title || "Unknown Movie"}
                    </p>
                    <p className="text-sm text-gray-400">
                      Screen {showtime.screenNumber || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-500">
                      {formatTime(showtime.startTime)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {showtime.availableSeats || 0} seats left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No showtimes scheduled for today
            </p>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Recent Bookings
            </h2>
            <Link
              to="/admin/cinema/bookings"
              className="text-sm text-red-500 hover:text-red-400 transition-colors"
            >
              View All →
            </Link>
          </div>
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="font-mono text-xs text-gray-400">
                      #{booking._id?.slice(-8) || "N/A"}
                    </p>
                    <p className="text-sm text-white mt-1">
                      {booking.seatIds?.length || 0} seat(s)
                    </p>
                  </div>
                  <div className="text-right">
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
                    <p className="text-sm font-medium text-white mt-1">
                      ${(booking.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No bookings found</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CinemaAdminDashboard;

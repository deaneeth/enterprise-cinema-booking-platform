// PlatformAnalytics.tsx - Analytics Dashboard for Platform Admin
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface OverviewStats {
  totalUsers: number;
  totalCinemas: number;
  totalMovies: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  todayBookings: number;
  pendingApplications: number;
}

interface DataPoint {
  date: string;
  revenue?: number;
  total?: number;
  confirmed?: number;
  cancelled?: number;
}

interface TopMovie {
  id: string;
  title: string;
  posterUrl?: string;
  count: number;
  revenue: number;
}

interface CinemaStat {
  id: string;
  name: string;
  city: string;
  totalShowtimes: number;
  totalBookings: number;
  totalRevenue: number;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtext?: string;
}> = ({ label, value, icon, color, subtext }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

const PlatformAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [revenueData, setRevenueData] = useState<DataPoint[]>([]);
  const [bookingsData, setBookingsData] = useState<DataPoint[]>([]);
  const [topMovies, setTopMovies] = useState<TopMovie[]>([]);
  const [cinemaStats, setCinemaStats] = useState<CinemaStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, revenueRes, bookingsRes, topMoviesRes, cinemasRes] =
        await Promise.all([
          api.get("/api/admin/analytics/overview"),
          api.get(`/api/admin/analytics/revenue?period=${period}`),
          api.get(`/api/admin/analytics/bookings?period=${period}`),
          api.get("/api/admin/analytics/top-movies"),
          api.get("/api/admin/analytics/cinemas"),
        ]);

      setOverview(overviewRes.data?.data || null);
      setRevenueData(revenueRes.data?.data?.dataPoints || []);
      setBookingsData(bookingsRes.data?.data?.dataPoints || []);
      setTopMovies(topMoviesRes.data?.data || []);
      setCinemaStats(cinemasRes.data?.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics" subtitle="Loading analytics data...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
      <AdminLayout title="Analytics" subtitle="Error loading analytics">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="System-wide statistics and trends"
    >
      {/* Period Selector */}
      <div className="mb-6 flex gap-2">
        {(["week", "month", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Users"
          value={overview?.totalUsers || 0}
          icon="👥"
          color="text-blue-600"
        />
        <StatCard
          label="Total Cinemas"
          value={overview?.totalCinemas || 0}
          icon="🎬"
          color="text-purple-600"
        />
        <StatCard
          label="Total Movies"
          value={overview?.totalMovies || 0}
          icon="🎥"
          color="text-green-600"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(overview?.totalRevenue || 0)}
          icon="💰"
          color="text-emerald-600"
        />
        <StatCard
          label="Total Bookings"
          value={overview?.totalBookings || 0}
          icon="🎟️"
          color="text-orange-600"
          subtext={`${overview?.confirmedBookings || 0} confirmed`}
        />
        <StatCard
          label="Today's Bookings"
          value={overview?.todayBookings || 0}
          icon="📅"
          color="text-indigo-600"
        />
        <StatCard
          label="Pending Applications"
          value={overview?.pendingApplications || 0}
          icon="📝"
          color={
            (overview?.pendingApplications || 0) > 0
              ? "text-yellow-600"
              : "text-gray-600"
          }
        />
        <StatCard
          label="Active Movies"
          value={overview?.totalMovies || 0}
          icon="🎞️"
          color="text-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart (Simple Bar) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Revenue Trend ({period})
          </h3>
          {revenueData.length > 0 ? (
            <div className="space-y-2">
              {revenueData.slice(-7).map((point, idx) => {
                const maxRevenue = Math.max(
                  ...revenueData.map((p) => p.revenue || 0),
                  1,
                );
                const width = ((point.revenue || 0) / maxRevenue) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20">
                      {new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(width, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {formatCurrency(point.revenue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No revenue data for this period
            </p>
          )}
        </div>

        {/* Bookings Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Bookings Trend ({period})
          </h3>
          {bookingsData.length > 0 ? (
            <div className="space-y-2">
              {bookingsData.slice(-7).map((point, idx) => {
                const maxBookings = Math.max(
                  ...bookingsData.map((p) => p.total || 0),
                  1,
                );
                const width = ((point.total || 0) / maxBookings) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-20">
                      {new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(width, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {point.total || 0} bookings
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No bookings data for this period
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movies */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Movies by Bookings
          </h3>
          {topMovies.length > 0 ? (
            <div className="space-y-3">
              {topMovies.slice(0, 5).map((movie, idx) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                >
                  <span className="text-lg font-bold text-gray-500 w-6">
                    {idx + 1}
                  </span>
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center">
                      🎬
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-white">{movie.title}</p>
                    <p className="text-xs text-gray-400">
                      {movie.count} bookings • {formatCurrency(movie.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No booking data yet
            </p>
          )}
        </div>

        {/* Cinema Performance */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Cinema Performance
          </h3>
          {cinemaStats.length > 0 ? (
            <div className="space-y-3">
              {cinemaStats.slice(0, 5).map((cinema, idx) => (
                <div
                  key={cinema.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                >
                  <span className="text-lg font-bold text-gray-500 w-6">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{cinema.name}</p>
                    <p className="text-xs text-gray-400">
                      {cinema.city} • {cinema.totalBookings} bookings •{" "}
                      {formatCurrency(cinema.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No cinema data yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PlatformAnalytics;

// BookingsView.tsx - View and manage bookings with cinema admin scoping
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Booking {
  _id: string;
  userId?: { firstName?: string; lastName?: string; email?: string } | string;
  showtimeId?:
    | {
        _id?: string;
        movieId?: { title?: string } | string;
        cinemaId?: { _id?: string; name?: string } | string;
        startTime?: string;
        screenNumber?: number;
      }
    | string;
  seatIds?: { seatNumber?: string }[] | string[];
  status: "pending" | "confirmed" | "cancelled" | "expired";
  totalAmount: number;
  createdAt?: string;
  qrCode?: string;
}

const BookingsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Cinema admin scoping
  const userCinemaId = currentUser?.cinemaId;
  const isCinemaAdmin = currentUser?.role === "cinema_admin";

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/bookings");
      const data = res.data?.data;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      setError(null);
      await api.patch(`/api/bookings/${bookingId}/cancel`);
      setSuccess("Booking cancelled successfully");
      fetchBookings();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "expired":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getUserName = (booking: Booking) => {
    if (typeof booking.userId === "object" && booking.userId) {
      return (
        `${booking.userId.firstName || ""} ${booking.userId.lastName || ""}`.trim() ||
        booking.userId.email ||
        "Unknown"
      );
    }
    return "Unknown";
  };

  const getMovieTitle = (booking: Booking) => {
    if (typeof booking.showtimeId === "object" && booking.showtimeId) {
      const movieId = booking.showtimeId.movieId;
      if (typeof movieId === "object" && movieId) {
        return movieId.title || "Unknown";
      }
    }
    return "Unknown";
  };

  const getCinemaId = (booking: Booking): string | undefined => {
    if (typeof booking.showtimeId === "object" && booking.showtimeId) {
      const cinemaId = booking.showtimeId.cinemaId;
      if (typeof cinemaId === "object" && cinemaId) {
        return cinemaId._id;
      }
      if (typeof cinemaId === "string") {
        return cinemaId;
      }
    }
    return undefined;
  };

  const getShowtimeInfo = (booking: Booking) => {
    if (typeof booking.showtimeId === "object" && booking.showtimeId) {
      const date = booking.showtimeId.startTime
        ? new Date(booking.showtimeId.startTime).toLocaleDateString()
        : "N/A";
      const time = booking.showtimeId.startTime
        ? new Date(booking.showtimeId.startTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A";
      return { date, time, screen: booking.showtimeId.screenNumber || "N/A" };
    }
    return { date: "N/A", time: "N/A", screen: "N/A" };
  };

  const getSeats = (booking: Booking) => {
    if (Array.isArray(booking.seatIds)) {
      return (
        booking.seatIds
          .map((s) => (typeof s === "object" ? s.seatNumber : s))
          .join(", ") || "-"
      );
    }
    return "-";
  };

  // Filter bookings - cinema admin only sees their cinema's bookings
  const filteredBookings = bookings
    .filter((b) => {
      // Cinema admin scoping
      if (isCinemaAdmin && userCinemaId) {
        const bookingCinemaId = getCinemaId(b);
        if (bookingCinemaId !== userCinemaId) return false;
      }
      // Status filter
      if (statusFilter && b.status !== statusFilter) return false;
      // Date filter
      if (dateFilter) {
        const bookingDate = new Date(b.createdAt || "")
          .toISOString()
          .split("T")[0];
        if (bookingDate !== dateFilter) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

  const stats = {
    total: filteredBookings.length,
    confirmed: filteredBookings.filter((b) => b.status === "confirmed").length,
    pending: filteredBookings.filter((b) => b.status === "pending").length,
    cancelled: filteredBookings.filter((b) => b.status === "cancelled").length,
    revenue: filteredBookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  };

  return (
    <AdminLayout
      title="Bookings"
      subtitle={
        isCinemaAdmin
          ? "Your cinema's bookings"
          : "View and manage all bookings"
      }
    >
      {/* No cinema assigned warning */}
      {isCinemaAdmin && !userCinemaId && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
          ⚠️ You haven't been assigned to a cinema. Please contact a platform
          administrator.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {stats.confirmed}
          </div>
          <div className="text-sm text-gray-400">Confirmed</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-red-400">
            {stats.cancelled}
          </div>
          <div className="text-sm text-gray-400">Cancelled</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
          <div className="text-2xl font-bold text-red-400">
            ${stats.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="" className="bg-[#1a1a2e]">All Statuses</option>
          <option value="confirmed" className="bg-[#1a1a2e]">Confirmed</option>
          <option value="pending" className="bg-[#1a1a2e]">Pending</option>
          <option value="cancelled" className="bg-[#1a1a2e]">Cancelled</option>
          <option value="expired" className="bg-[#1a1a2e]">Expired</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {(statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setDateFilter("");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
          {success}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {isCinemaAdmin && !userCinemaId
              ? "No cinema assigned to your account"
              : "No bookings found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Movie
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Showtime
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Seats
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const showtimeInfo = getShowtimeInfo(booking);
                  return (
                    <tr
                      key={booking._id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-gray-400">
                          #{booking._id.slice(-8)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {getUserName(booking)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-white">
                        {getMovieTitle(booking)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-white">
                          {showtimeInfo.date}
                        </div>
                        <div className="text-xs text-gray-400">
                          {showtimeInfo.time} • Screen {showtimeInfo.screen}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {getSeats(booking)}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        ${booking.totalAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BookingsView;

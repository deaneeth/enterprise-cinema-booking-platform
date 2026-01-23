// ShowtimeManagement.tsx - Full CRUD with proper cinema admin scoping
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface Movie {
  _id: string;
  title: string;
}

interface Cinema {
  _id: string;
  name: string;
  screens?: number;
}

interface Showtime {
  _id: string;
  movieId: Movie | string;
  cinemaId: Cinema | string;
  startTime: string;
  endTime?: string;
  screenNumber: number;
  price: number;
  format?: string;
  totalSeats?: number;
  availableSeats?: number;
  language?: string;
  isActive?: boolean;
}

interface FormData {
  movieId: string;
  cinemaId: string;
  startTime: string;
  screenNumber: number;
  price: number;
  vipPrice: number;
  format: string;
  totalSeats: number;
  language: string;
}

const ShowtimeManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState<FormData>({
    movieId: "",
    cinemaId: "",
    startTime: "",
    screenNumber: 1,
    price: 12.99,
    vipPrice: 19.99,
    format: "2D",
    totalSeats: 100,
    language: "English",
  });
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  // Cinema admin scoping
  const userCinemaId = currentUser?.cinemaId;
  const isCinemaAdmin = currentUser?.role === "cinema_admin";
  const isPlatformAdmin = currentUser?.role === "platform_admin";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showtimesRes, moviesRes, cinemasRes] = await Promise.all([
        api.get("/api/showtimes"),
        api.get("/api/movies"),
        api.get("/api/cinemas"),
      ]);

      const showtimesData = showtimesRes.data?.data || showtimesRes.data || [];
      const moviesData = moviesRes.data?.data;
      const cinemasData = cinemasRes.data?.data;

      setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
      setMovies(
        Array.isArray(moviesData) ? moviesData : moviesData?.movies || [],
      );
      setCinemas(
        cinemasData?.cinemas || (Array.isArray(cinemasData) ? cinemasData : []),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingShowtime(null);
    setError(null);
    setSuccess(null);
    // For cinema_admin, auto-set and lock to their cinema
    const defaultCinemaId =
      isCinemaAdmin && userCinemaId ? userCinemaId : cinemas[0]?._id || "";
    setFormData({
      movieId: movies[0]?._id || "",
      cinemaId: defaultCinemaId,
      startTime: "",
      screenNumber: 1,
      price: 12.99,
      vipPrice: 19.99,
      format: "2D",
      totalSeats: 100,
      language: "English",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    setError(null);
    setSuccess(null);
    const movieId =
      typeof showtime.movieId === "object"
        ? showtime.movieId._id
        : showtime.movieId;
    const cinemaId =
      typeof showtime.cinemaId === "object"
        ? showtime.cinemaId._id
        : showtime.cinemaId;

    setFormData({
      movieId,
      cinemaId,
      startTime: showtime.startTime?.slice(0, 16) || "",
      screenNumber: showtime.screenNumber || 1,
      price: showtime.price || 12.99,
      vipPrice: (showtime as any).vipPrice || (showtime.price || 12.99) * 1.5,
      format: showtime.format || "2D",
      totalSeats: showtime.totalSeats || 100,
      language: showtime.language || "English",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Ensure cinema_admin can only use their cinema
      const cinemaIdToUse =
        isCinemaAdmin && userCinemaId ? userCinemaId : formData.cinemaId;

      const payload = {
        movieId: formData.movieId,
        cinemaId: cinemaIdToUse,
        startTime: new Date(formData.startTime).toISOString(),
        screenNumber: Number(formData.screenNumber),
        price: Number(formData.price),
        vipPrice: Number(formData.vipPrice),
        format: formData.format,
        totalSeats: Number(formData.totalSeats),
        language: formData.language,
      };

      if (editingShowtime) {
        await api.put(`/api/showtimes/${editingShowtime._id}`, payload);
        setSuccess("Showtime updated successfully!");
      } else {
        await api.post("/api/showtimes", payload);
        setSuccess("Showtime created successfully!");
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (showtimeId: string) => {
    if (!window.confirm("Are you sure you want to delete this showtime?"))
      return;

    try {
      setError(null);
      await api.delete(`/api/showtimes/${showtimeId}`);
      setSuccess("Showtime deleted successfully!");
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getMovieTitle = (showtime: Showtime) => {
    return typeof showtime.movieId === "object"
      ? showtime.movieId.title
      : "Unknown";
  };

  const getCinemaName = (showtime: Showtime) => {
    return typeof showtime.cinemaId === "object"
      ? showtime.cinemaId.name
      : "Unknown";
  };

  // Filter showtimes by date and cinema (for cinema_admin)
  const filteredShowtimes = showtimes
    .filter((s) => {
      // Cinema admin scoping: only show their cinema's showtimes
      if (isCinemaAdmin && userCinemaId) {
        const showtimeCinemaId =
          typeof s.cinemaId === "object" ? s.cinemaId._id : s.cinemaId;
        if (showtimeCinemaId !== userCinemaId) return false;
      }
      // Date filter
      if (!filterDate) return true;
      const showDate = new Date(s.startTime).toISOString().split("T")[0];
      return showDate === filterDate;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // Get the user's cinema name for display
  const userCinemaName =
    cinemas.find((c) => c._id === userCinemaId)?.name || "Your Cinema";

  return (
    <AdminLayout
      title="Showtime Management"
      subtitle={
        isCinemaAdmin
          ? `Managing: ${userCinemaName}`
          : "Schedule and manage movie showtimes"
      }
    >
      {/* No cinema assigned warning */}
      {isCinemaAdmin && !userCinemaId && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
          ⚠️ You haven't been assigned to a cinema. Please contact a platform
          administrator.
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={isCinemaAdmin && !userCinemaId}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-colors font-medium disabled:opacity-50"
        >
          + Add Showtime
        </button>
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

      {/* Showtimes Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading showtimes...
          </div>
        ) : filteredShowtimes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {isCinemaAdmin && !userCinemaId
              ? "No cinema assigned to your account"
              : "No showtimes found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Movie
                  </th>
                  {isPlatformAdmin && (
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Cinema
                    </th>
                  )}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Screen
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Format
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Seats
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredShowtimes.map((showtime) => {
                  const { date, time } = formatDateTime(showtime.startTime);
                  return (
                    <tr
                      key={showtime._id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-3 px-4 font-medium text-white">
                        {getMovieTitle(showtime)}
                      </td>
                      {isPlatformAdmin && (
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {getCinemaName(showtime)}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-white">
                          {date}
                        </div>
                        <div className="text-sm text-red-400">{time}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-sm">
                          Screen {showtime.screenNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-medium">
                          {showtime.format || "2D"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        ${showtime.price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`${(showtime.availableSeats || 0) < 10 ? "text-red-400" : "text-green-400"}`}
                        >
                          {showtime.availableSeats || 0}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          / {showtime.totalSeats || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleOpenEdit(showtime)}
                            className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Regenerate all seats? This will reset seat availability.",
                                )
                              )
                                return;
                              try {
                                setError(null);
                                await api.post(
                                  `/api/showtimes/${showtime._id}/regenerate-seats`,
                                );
                                setSuccess(
                                  `Seats regenerated for this showtime!`,
                                );
                                fetchData();
                              } catch (err) {
                                setError(getErrorMessage(err));
                              }
                            }}
                            className="px-3 py-1 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30"
                          >
                            Regen Seats
                          </button>
                          <button
                            onClick={() => handleDelete(showtime._id)}
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {editingShowtime ? "Edit Showtime" : "Add New Showtime"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Movie Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Movie *
                </label>
                <select
                  required
                  value={formData.movieId}
                  onChange={(e) =>
                    setFormData({ ...formData, movieId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="" className="bg-[#1a1a2e]">Select a movie</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id} className="bg-[#1a1a2e]">
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cinema Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cinema *
                </label>
                {isCinemaAdmin && userCinemaId ? (
                  <div className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-gray-300">
                    {userCinemaName}
                    <span className="text-xs text-gray-500 ml-2">
                      (Your assigned cinema)
                    </span>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.cinemaId}
                    onChange={(e) =>
                      setFormData({ ...formData, cinemaId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select a cinema</option>
                    {cinemas.map((c) => (
                      <option key={c._id} value={c._id} className="bg-[#1a1a2e]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date/Time and Screen */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Screen #
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.screenNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screenNumber: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Format and Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Format *
                  </label>
                  <select
                    required
                    value={formData.format}
                    onChange={(e) =>
                      setFormData({ ...formData, format: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="2D" className="bg-[#1a1a2e]">2D</option>
                    <option value="3D" className="bg-[#1a1a2e]">3D</option>
                    <option value="IMAX" className="bg-[#1a1a2e]">IMAX</option>
                    <option value="4DX" className="bg-[#1a1a2e]">4DX</option>
                    <option value="Dolby" className="bg-[#1a1a2e]">Dolby Cinema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Price and Seats */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Regular Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    VIP Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.vipPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vipPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">First 2 rows (A-B)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Total Seats *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalSeats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalSeats: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Error display in modal */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingShowtime ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ShowtimeManagement;

// MovieManagement.tsx (Phase 3.3 - Platform Admin)
// Full CRUD management for movies
// List, create, edit, delete movies

import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface Movie {
  _id: string;
  title: string;
  description?: string;
  genre?: string[];
  duration?: number;
  rating?: string;
  releaseDate?: string;
  posterUrl?: string;
  language?: string;
  cast?: string[];
  director?: string;
  trailerUrl?: string;
  isActive?: boolean;
}

interface MovieFormData {
  title: string;
  description: string;
  genre: string;
  duration: number;
  rating: string;
  releaseDate: string;
  posterUrl: string;
  language: string;
  cast: string;
  director: string;
  trailerUrl: string;
}

const initialFormData: MovieFormData = {
  title: "",
  description: "",
  genre: "",
  duration: 120,
  rating: "PG-13",
  releaseDate: "",
  posterUrl: "",
  language: "English",
  cast: "",
  director: "",
  trailerUrl: "",
};

const MovieManagement: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/movies");
      const data = res.data?.data;
      setMovies(Array.isArray(data) ? data : data?.movies || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenCreate = () => {
    setEditingMovie(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      genre: movie.genre?.join(", ") || "",
      duration: movie.duration || 120,
      rating: movie.rating || "PG-13",
      releaseDate: movie.releaseDate?.split("T")[0] || "",
      posterUrl: movie.posterUrl || "",
      language: movie.language || "English",
      cast: movie.cast?.join(", ") || "",
      director: movie.director || "",
      trailerUrl: movie.trailerUrl || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        genre: formData.genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        cast: formData.cast
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        duration: Number(formData.duration),
      };

      if (editingMovie) {
        await api.put(`/api/movies/${editingMovie._id}`, payload);
      } else {
        await api.post("/api/movies", payload);
      }

      setShowModal(false);
      fetchMovies();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movieId: string) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;

    try {
      await api.delete(`/api/movies/${movieId}`);
      fetchMovies();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout
      title="Movie Management"
      subtitle="Create, edit, and manage movies"
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all font-medium shadow-lg shadow-red-600/20"
        >
          + Add Movie
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Movies Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading movies...</div>
        ) : filteredMovies.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No movies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Poster
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Genre
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => (
                  <tr
                    key={movie._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-white/10 rounded flex items-center justify-center text-xl">
                          🎬
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">
                        {movie.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {movie.language}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {movie.genre?.join(", ") || "-"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {movie.duration ? `${movie.duration} min` : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-medium text-gray-300">
                        {movie.rating || "NR"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(movie)}
                          className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movie._id)}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {editingMovie ? "Edit Movie" : "Add New Movie"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genre (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.genre}
                    placeholder="Action, Thriller"
                    onChange={(e) =>
                      setFormData({ ...formData, genre: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rating
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData({ ...formData, rating: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="G" className="bg-[#1a1a2e]">G</option>
                    <option value="PG" className="bg-[#1a1a2e]">PG</option>
                    <option value="PG-13" className="bg-[#1a1a2e]">PG-13</option>
                    <option value="R" className="bg-[#1a1a2e]">R</option>
                    <option value="NC-17" className="bg-[#1a1a2e]">NC-17</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Poster URL
                </label>
                <input
                  type="url"
                  value={formData.posterUrl}
                  placeholder="https://example.com/poster.jpg"
                  onChange={(e) =>
                    setFormData({ ...formData, posterUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trailer URL
                </label>
                <input
                  type="url"
                  value={formData.trailerUrl}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) =>
                    setFormData({ ...formData, trailerUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Director
                  </label>
                  <input
                    type="text"
                    value={formData.director}
                    placeholder="Christopher Nolan"
                    onChange={(e) =>
                      setFormData({ ...formData, director: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cast (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.cast}
                    placeholder="Actor 1, Actor 2, Actor 3"
                    onChange={(e) =>
                      setFormData({ ...formData, cast: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingMovie
                      ? "Update Movie"
                      : "Create Movie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MovieManagement;

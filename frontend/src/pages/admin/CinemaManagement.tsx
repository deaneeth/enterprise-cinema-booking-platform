// CinemaManagement.tsx (Phase 3.3 - Platform Admin)
// Full CRUD management for cinemas

import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";

interface Cinema {
  _id: string;
  name: string;
  chain?: string;
  location?: {
    address?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  facilities?: string[];
  screens?: number;
  isActive?: boolean;
}

interface CinemaFormData {
  name: string;
  chain: string;
  address: string;
  city: string;
  facilities: string;
  screens: number;
}

const initialFormData: CinemaFormData = {
  name: "",
  chain: "",
  address: "",
  city: "",
  facilities: "",
  screens: 1,
};

const CinemaManagement: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCinema, setEditingCinema] = useState<Cinema | null>(null);
  const [formData, setFormData] = useState<CinemaFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCinemas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cinemas");
      const data = res.data?.data;
      setCinemas(data?.cinemas || (Array.isArray(data) ? data : []));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  const handleOpenCreate = () => {
    setEditingCinema(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (cinema: Cinema) => {
    setEditingCinema(cinema);
    setFormData({
      name: cinema.name || "",
      chain: cinema.chain || "",
      address: cinema.location?.address || "",
      city: cinema.location?.city || "",
      facilities: cinema.facilities?.join(", ") || "",
      screens: cinema.screens || 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        chain: formData.chain,
        location: {
          address: formData.address,
          city: formData.city,
        },
        facilities: formData.facilities
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        screens: Number(formData.screens),
      };

      if (editingCinema) {
        await api.put(`/api/cinemas/${editingCinema._id}`, payload);
      } else {
        await api.post("/api/cinemas", payload);
      }

      setShowModal(false);
      fetchCinemas();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cinemaId: string) => {
    if (!window.confirm("Are you sure you want to delete this cinema?")) return;

    try {
      await api.delete(`/api/cinemas/${cinemaId}`);
      fetchCinemas();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredCinemas = cinemas.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout
      title="Cinema Management"
      subtitle="Manage cinema locations and facilities"
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
        <input
          type="text"
          placeholder="Search cinemas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-colors font-medium"
        >
          + Add Cinema
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Cinemas Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading cinemas...</div>
      ) : filteredCinemas.length === 0 ? (
        <div className="p-8 text-center text-gray-400 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          No cinemas found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCinemas.map((cinema) => (
            <div
              key={cinema._id}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {cinema.name}
                  </h3>
                  {cinema.chain && (
                    <p className="text-sm text-red-400">{cinema.chain}</p>
                  )}
                </div>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium rounded">
                  {cinema.screens || 0} Screens
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>📍</span>
                  <span>{cinema.location?.city || "No location"}</span>
                </div>
                {cinema.location?.address && (
                  <p className="text-xs text-gray-400 pl-6">
                    {cinema.location.address}
                  </p>
                )}
              </div>

              {cinema.facilities && cinema.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {cinema.facilities.slice(0, 4).map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-full"
                    >
                      {f}
                    </span>
                  ))}
                  {cinema.facilities.length > 4 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                      +{cinema.facilities.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleOpenEdit(cinema)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cinema._id)}
                  className="px-3 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {editingCinema ? "Edit Cinema" : "Add New Cinema"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cinema Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Chain
                  </label>
                  <input
                    type="text"
                    value={formData.chain}
                    placeholder="e.g., AMC, Regal"
                    onChange={(e) =>
                      setFormData({ ...formData, chain: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Screens
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.screens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        screens: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Facilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.facilities}
                  placeholder="IMAX, Dolby Atmos, Parking"
                  onChange={(e) =>
                    setFormData({ ...formData, facilities: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingCinema ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CinemaManagement;

// CinemaSettings.tsx (Phase 3.2 - Cinema Admin)
// View and update cinema settings (for cinema admin)

import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api, { getErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface CinemaSettings {
  name: string;
  chain: string;
  address: string;
  city: string;
  facilities: string;
  screens: number;
}

const CinemaSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<CinemaSettings>({
    name: "",
    chain: "",
    address: "",
    city: "",
    facilities: "",
    screens: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cinemaId, setCinemaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCinema = async () => {
      try {
        setLoading(true);

        // Use the user's assigned cinemaId
        const userCinemaId = currentUser?.cinemaId;

        if (!userCinemaId) {
          // No cinema assigned - show message
          setLoading(false);
          return;
        }

        // Fetch the specific cinema assigned to this user
        const res = await api.get(`/api/cinemas/${userCinemaId}`);
        const cinema = res.data?.data?.cinema || res.data?.data;

        if (cinema) {
          setCinemaId(cinema._id || userCinemaId);
          setSettings({
            name: cinema.name || "",
            chain: cinema.chain || "",
            address: cinema.location?.address || "",
            city: cinema.location?.city || "",
            facilities: cinema.facilities?.join(", ") || "",
            screens: cinema.screens || 1,
          });
        } else {
          setError("Cinema not found");
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchCinema();
    }
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cinemaId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: settings.name,
        chain: settings.chain,
        location: {
          address: settings.address,
          city: settings.city,
        },
        facilities: settings.facilities
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean),
        screens: Number(settings.screens),
      };

      await api.put(`/api/cinemas/${cinemaId}`, payload);
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Cinema Settings" subtitle="Loading...">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center text-gray-400">
          Loading settings...
        </div>
      </AdminLayout>
    );
  }

  if (!cinemaId) {
    return (
      <AdminLayout title="Cinema Settings" subtitle="No cinema assigned">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 text-center text-yellow-400">
          <p className="text-lg font-medium mb-2">No Cinema Assigned</p>
          <p className="text-sm text-yellow-400/80">
            You don't have a cinema assigned to your account yet. Please contact
            a platform administrator.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Cinema Settings"
      subtitle="Manage your cinema information"
    >
      <form onSubmit={handleSave} className="max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
            {success}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-4">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Cinema Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Chain Name
              </label>
              <input
                type="text"
                value={settings.chain}
                placeholder="e.g., AMC, Regal"
                onChange={(e) =>
                  setSettings({ ...settings, chain: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) =>
                  setSettings({ ...settings, city: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Number of Screens
              </label>
              <input
                type="number"
                min="1"
                value={settings.screens}
                onChange={(e) =>
                  setSettings({ ...settings, screens: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Facilities (comma-separated)
            </label>
            <input
              type="text"
              value={settings.facilities}
              placeholder="IMAX, Dolby Atmos, Parking, Food Court"
              onChange={(e) =>
                setSettings({ ...settings, facilities: e.target.value })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter facilities separated by commas
            </p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CinemaSettingsPage;

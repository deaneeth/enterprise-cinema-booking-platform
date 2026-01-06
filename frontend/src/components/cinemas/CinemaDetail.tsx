import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api";
import ShowtimeList from "../showtimes/ShowtimeList";

interface Cinema {
  _id: string;
  name: string;
  chain?: string;
  location?: {
    address?: string;
    city?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  facilities: string[];
  screens?: number;
  adminUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CinemaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cinema, setCinema] = useState<Cinema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShowtimes, setShowShowtimes] = useState(false);

  useEffect(() => {
    const fetchCinema = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{
          success: boolean;
          data: { cinema: Cinema };
        }>(`/api/cinemas/${id}`);
        if (response.data.success) {
          setCinema(response.data.data.cinema);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCinema();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">Cinema Not Found</h2>
        <p className="mt-2 text-gray-600">
          {error || "The cinema you're looking for doesn't exist."}
        </p>
        <Link
          to="/cinemas"
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Back to Cinemas
        </Link>
      </div>
    );
  }

  const city = cinema.location?.city || "City not specified";
  const address = cinema.location?.address || "Address not specified";
  const facilities = Array.isArray(cinema.facilities) ? cinema.facilities : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Back Button */}
        <Link
          to="/cinemas"
          className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Cinemas
        </Link>

        {/* Cinema Info Card */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {cinema.name}
              </h1>
              {cinema.chain && (
                <p className="mt-1 text-lg text-indigo-600">{cinema.chain}</p>
              )}
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Open
            </span>
          </div>

          {/* Location */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>
            <div className="mt-3 space-y-2">
              <p className="flex items-center text-gray-600">
                <svg
                  className="mr-3 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {address}
              </p>
              <p className="flex items-center text-gray-600">
                <svg
                  className="mr-3 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {city}
              </p>
            </div>
          </div>

          {/* Screens */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">Screens</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {typeof cinema.screens === "number" ? cinema.screens : "N/A"}
            </p>
          </div>

          {/* Facilities */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">Facilities</h2>
            {facilities.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {facilities.map((facility, index) => (
                  <span
                    key={`${facility}-${index}`}
                    className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-gray-500">No facilities listed</p>
            )}
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowShowtimes(!showShowtimes)}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              {showShowtimes ? "Hide Showtimes" : "View Showtimes"}
            </button>
          </div>

          {/* Showtime List */}
          {showShowtimes && cinema && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Available Showtimes</h2>
              <ShowtimeList cinemaId={cinema._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CinemaDetail;




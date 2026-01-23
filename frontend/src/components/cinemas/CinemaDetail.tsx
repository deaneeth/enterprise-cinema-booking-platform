import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api";
import ShowtimeList from "../showtimes/ShowtimeList";
import { ReviewList } from "../reviews";

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
          document.title = `${response.data.data.cinema.name} | Cinema Booking`;
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !cinema) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f]">
        <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Cinema Not Found</h2>
        <p className="text-gray-400 mb-6">
          {error || "The cinema you're looking for doesn't exist."}
        </p>
        <Link
          to="/cinemas"
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      {/* Back Navigation */}
      <div className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-lg sticky top-16 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            to="/cinemas"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cinemas
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Cinema Header Card */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{cinema.name}</h1>
                {cinema.chain && (
                  <p className="text-red-400 font-medium mt-1">{cinema.chain}</p>
                )}
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              cinema.isActive 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
            }`}>
              {cinema.isActive ? "Open" : "Closed"}
            </span>
          </div>

          {/* Location */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Location</h2>
            <div className="space-y-3">
              <p className="flex items-center text-gray-300">
                <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {address}
              </p>
              <p className="flex items-center text-gray-300">
                <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {city}
              </p>
            </div>
          </div>

          {/* Screens */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Screens</h2>
            <p className="text-4xl font-bold text-white">
              {typeof cinema.screens === "number" ? cinema.screens : "N/A"}
            </p>
          </div>

          {/* Facilities */}
          <div className="border-t border-white/10 pt-6 mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Facilities</h2>
            {facilities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {facilities.map((facility, index) => (
                  <span
                    key={`${facility}-${index}`}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 rounded-full border border-white/10"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No facilities listed</p>
            )}
          </div>

          {/* View Showtimes Button */}
          <button
            onClick={() => setShowShowtimes(!showShowtimes)}
            className="w-full py-4 bg-red-600 text-white text-lg font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showShowtimes ? "Hide Showtimes" : "View Showtimes"}
          </button>

          {/* Showtime List */}
          {showShowtimes && cinema && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="text-lg font-semibold text-white mb-4">Available Showtimes</h2>
              <ShowtimeList cinemaId={cinema._id} />
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8">
          <ReviewList targetType="cinema" targetId={id || ""} />
        </div>
      </div>
    </div>
  );
};

export default CinemaDetail;

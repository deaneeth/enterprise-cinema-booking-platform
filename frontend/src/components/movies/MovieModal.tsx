// MovieModal.tsx (Member 8 - UI Enhancement)
// Cinematic movie detail modal with dark/light mode support
// Features: Hero backdrop, glassmorphism, expandable showtimes panel

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api, { ApiResponse } from "../../services/api";
import { Movie } from "../../types/Movie";

interface Cinema {
  _id: string;
  name: string;
  location?: { city?: string };
}

interface ShowtimeData {
  _id: string;
  cinemaId: Cinema;
  startTime: string;
  format?: string;
  price: number;
  availableSeats: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie;
  theme?: "dark" | "light";
}

// Helper: Get initials from name
const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Helper: Get avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-teal-600",
    "bg-orange-600",
    "bg-cyan-600",
    "bg-rose-600",
  ];
  const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper: Format duration
const formatDuration = (mins?: number): string => {
  if (!mins || mins <= 0) return "N/A";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Helper: Format date
const formatDate = (iso?: string): string => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

// Helper: Extract YouTube ID
const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.pathname === "/watch") {
      return u.searchParams.get("v");
    }
    if (u.hostname === "youtu.be") {
      return u.pathname.replace("/", "");
    }
    const match = url.match(/(?:embed|v)\/([\w-]{11})/);
    if (match?.[1]) return match[1];
    return null;
  } catch {
    return null;
  }
};

const MovieModal: React.FC<MovieModalProps> = ({
  isOpen,
  onClose,
  movie,
  theme = "dark",
}) => {
  const [_showtimes, setShowtimes] = useState<ShowtimeData[]>([]);
  const [cinemaMap, setCinemaMap] = useState<Map<string, ShowtimeData[]>>(
    new Map(),
  );
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [showAllShowtimes, setShowAllShowtimes] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const isDark = theme === "dark";

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Small delay for animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowAllShowtimes(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load showtimes
  const loadShowtimes = useCallback(async () => {
    if (!movie._id) return;
    setShowtimesLoading(true);
    try {
      const res = await api.get<ApiResponse<ShowtimeData[]>>(
        `/api/movies/${movie._id}/showtimes`,
      );
      let data: ShowtimeData[] = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data) {
        data = (res.data as any).data || [];
      }
      setShowtimes(data);

      // Group by cinema
      const map = new Map<string, ShowtimeData[]>();
      data.forEach((st) => {
        const cinemaId = (st.cinemaId as any)?._id || st.cinemaId;
        if (!map.has(cinemaId)) map.set(cinemaId, []);
        map.get(cinemaId)!.push(st);
      });
      setCinemaMap(map);
    } catch (err) {
      console.error("Failed to load showtimes:", err);
    } finally {
      setShowtimesLoading(false);
    }
  }, [movie._id]);

  // Load review stats
  const loadReviewStats = useCallback(async () => {
    if (!movie._id) return;
    try {
      const res = await api.get<any>(
        `/api/movies/${movie._id}/reviews?limit=1`,
      );
      const data = res.data?.data;
      if (data) {
        setReviewStats({
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
        });
      }
    } catch {
      // Silent fail
    }
  }, [movie._id]);

  useEffect(() => {
    if (isOpen && movie._id) {
      loadShowtimes();
      loadReviewStats();
    }
  }, [isOpen, movie._id, loadShowtimes, loadReviewStats]);

  if (!isAnimating && !isOpen) return null;

  const videoId = movie.trailerUrl ? extractYouTubeId(movie.trailerUrl) : null;

  // Get unique cinemas from showtimes
  const cinemasWithShowtimes = Array.from(cinemaMap.entries()).map(
    ([_, sts]) => ({
      cinema: sts[0]?.cinemaId as Cinema,
      showtimes: sts,
    }),
  );

  // Theme classes
  const bgClass = isDark ? "bg-[#0F1115]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-600";
  const textMuted = isDark ? "text-gray-500" : "text-gray-400";
  const borderClass = isDark ? "border-white/10" : "border-gray-200";
  const cardBg = isDark
    ? "bg-white/5 backdrop-blur-sm"
    : "bg-gray-50 backdrop-blur-sm";
  const pillBg = isDark
    ? "bg-white/10 border-white/20"
    : "bg-gray-100 border-gray-200";
  const pillText = isDark ? "text-gray-300" : "text-gray-700";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ margin: 0, left: 0, right: 0, top: 0, bottom: 0 }}
    >
      {/* Simple backdrop overlay - no blur for performance */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex transition-all duration-300 transform ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${
          showAllShowtimes ? "max-w-6xl" : "max-w-4xl"
        } w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${borderClass} ${bgClass}`}
        style={{ margin: '0 auto' }}
      >
        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            showAllShowtimes ? "w-2/3" : "w-full"
          }`}
        >
          {/* Hero Section */}
          <div className="relative h-64 sm:h-80 flex-shrink-0 overflow-hidden">
            {/* Background Image */}
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className={`absolute inset-0 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}
              />
            )}

            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-t ${
                isDark
                  ? "from-[#0F1115] via-[#0F1115]/80 to-transparent"
                  : "from-white via-white/80 to-transparent"
              }`}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className={`absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full ${
                isDark
                  ? "bg-black/50 hover:bg-black/70 text-white"
                  : "bg-white/80 hover:bg-white text-gray-700"
              } backdrop-blur-sm transition-colors`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Title & Metadata - Bottom of hero */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2
                className={`text-3xl sm:text-4xl font-bold tracking-tight ${textPrimary}`}
              >
                {movie.title}
              </h2>

              {/* Metadata Row */}
              <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {movie.rating && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold border rounded ${
                      isDark
                        ? "border-white/30 text-white"
                        : "border-gray-400 text-gray-700"
                    }`}
                  >
                    {movie.rating}
                  </span>
                )}
                <span className={`text-sm ${textSecondary}`}>
                  {formatDuration(movie.duration)}
                </span>
                {movie.releaseDate && (
                  <>
                    <span className={textMuted}>•</span>
                    <span className={`text-sm ${textSecondary}`}>
                      {formatDate(movie.releaseDate)}
                    </span>
                  </>
                )}
                {movie.language && (
                  <>
                    <span className={textMuted}>•</span>
                    <span className={`text-sm ${textSecondary}`}>
                      {movie.language}
                    </span>
                  </>
                )}
              </div>

              {/* Genre Pills */}
              {movie.genre && movie.genre.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.genre.slice(0, 4).map((g) => (
                    <span
                      key={g}
                      className={`px-3 py-1 text-xs font-medium border rounded-full ${pillBg} ${pillText}`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Book Tickets Button */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    const section = document.getElementById("modal-cinemas");
                    section?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    isDark
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  Book Tickets
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Synopsis */}
            {movie.description && (
              <section>
                <h3
                  className={`text-sm font-semibold uppercase tracking-wider ${textMuted}`}
                >
                  Synopsis
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${textSecondary}`}>
                  {movie.description}
                </p>
              </section>
            )}

            {/* Director & Cast */}
            <section className="flex flex-col sm:flex-row gap-6">
              {/* Director */}
              {movie.director && (
                <div className="flex-shrink-0">
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${textMuted}`}
                  >
                    Director
                  </h3>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/20 ${getAvatarColor(
                        movie.director,
                      )}`}
                    >
                      {getInitials(movie.director)}
                    </div>
                    <span className={`text-sm font-medium ${textPrimary}`}>
                      {movie.director}
                    </span>
                  </div>
                </div>
              )}

              {/* Cast */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="flex-1">
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${textMuted}`}
                  >
                    Starring
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {movie.cast.slice(0, 5).map((actor, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/20 ${getAvatarColor(
                            actor,
                          )}`}
                        >
                          {getInitials(actor)}
                        </div>
                        <span className={`text-xs ${textSecondary}`}>
                          {actor.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {movie.cast.length > 5 && (
                      <span className={`text-xs self-center ${textMuted}`}>
                        +{movie.cast.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Trailer & Cinemas Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trailer */}
              {videoId && (
                <section>
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${textMuted}`}
                  >
                    Official Trailer
                  </h3>
                  <div
                    className={`mt-2 rounded-xl overflow-hidden ${cardBg} border ${borderClass}`}
                  >
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                        title="Movie Trailer"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Cinema Selection */}
              <section id="modal-cinemas">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wider ${textMuted}`}
                  >
                    Select Cinema
                  </h3>
                  {cinemasWithShowtimes.length > 2 && (
                    <button
                      onClick={() => setShowAllShowtimes(!showAllShowtimes)}
                      className={`text-xs font-medium ${
                        isDark
                          ? "text-indigo-400 hover:text-indigo-300"
                          : "text-indigo-600 hover:text-indigo-700"
                      } transition-colors`}
                    >
                      {showAllShowtimes ? "← Hide" : "View All →"}
                    </button>
                  )}
                </div>

                {showtimesLoading ? (
                  <div className="mt-3 flex items-center justify-center py-8">
                    <div
                      className={`w-6 h-6 border-2 rounded-full animate-spin ${
                        isDark
                          ? "border-white/30 border-t-white"
                          : "border-gray-300 border-t-gray-700"
                      }`}
                    />
                  </div>
                ) : cinemasWithShowtimes.length === 0 ? (
                  <p className={`mt-3 text-sm ${textMuted}`}>
                    No showtimes available
                  </p>
                ) : (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {cinemasWithShowtimes
                      .slice(0, showAllShowtimes ? undefined : 3)
                      .map(({ cinema, showtimes: sts }) => (
                        <div
                          key={cinema?._id || Math.random()}
                          className={`flex-shrink-0 w-40 rounded-xl p-3 border ${cardBg} ${borderClass}`}
                        >
                          <h4
                            className={`text-sm font-medium truncate ${textPrimary}`}
                          >
                            {cinema?.name || "Cinema"}
                          </h4>
                          {cinema?.location?.city && (
                            <p className={`text-xs truncate ${textMuted}`}>
                              {cinema.location.city}
                            </p>
                          )}
                          <div className="mt-2 space-y-1.5">
                            {sts.slice(0, 2).map((st) => {
                              const dt = new Date(st.startTime);
                              return (
                                <Link
                                  key={st._id}
                                  to={`/booking/${st._id}`}
                                  onClick={onClose}
                                  className="block px-2 py-1.5 text-xs font-medium text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                  {dt.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                  ,{" "}
                                  {dt.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>

            {/* Reviews Footer */}
            <section className={`border-t pt-4 ${borderClass}`}>
              <Link
                to={`/movies/${movie._id}#reviews`}
                onClick={onClose}
                className={`flex items-center justify-between p-3 rounded-xl ${cardBg} border ${borderClass} hover:bg-gray-100`}
              >
                <div className="flex items-center gap-3">
                  {/* Stars */}
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (reviewStats?.averageRating || 0)
                            ? "text-amber-400"
                            : isDark
                              ? "text-gray-600"
                              : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {reviewStats?.averageRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className={`text-sm ${textSecondary}`}>
                    ({reviewStats?.totalReviews || 0} reviews)
                  </span>
                </div>
                <span
                  className={`text-xs font-medium flex items-center gap-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  See all reviews
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>
            </section>
          </div>
        </div>

        {/* Expandable Showtimes Panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out border-l ${borderClass} ${
            showAllShowtimes ? "w-1/3 opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="h-full flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary}`}>
                All Showtimes
              </h3>
              <button
                onClick={() => setShowAllShowtimes(false)}
                className={`text-sm ${textMuted} hover:${textSecondary}`}
              >
                ← Back
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {cinemasWithShowtimes.map(({ cinema, showtimes: sts }) => (
                <div key={cinema?._id || Math.random()}>
                  <h4 className={`text-sm font-medium ${textPrimary}`}>
                    {cinema?.name || "Cinema"}
                  </h4>
                  {cinema?.location?.city && (
                    <p className={`text-xs ${textMuted}`}>
                      {cinema.location.city}
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {sts.map((st) => {
                      const dt = new Date(st.startTime);
                      return (
                        <Link
                          key={st._id}
                          to={`/booking/${st._id}`}
                          onClick={onClose}
                          className="px-3 py-2 text-xs font-medium text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <div>
                            {dt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="font-bold">
                            {dt.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { ApiResponse } from "../../services/api";
import { AxiosError } from "axios";
import { Movie } from "../../types/Movie";
import { format, startOfDay, endOfDay, addDays } from "date-fns";

type Props = { movieId?: string };

interface Cinema {
  _id: string;
  name: string;
  location?: {
    city?: string;
  };
}

interface ShowtimeData {
  _id: string;
  cinemaId: Cinema;
  startTime: string;
  format?: string;
  price: number;
  availableSeats: number;
}

const formatDate = (iso?: string) => {
  if (!iso) return "Unknown";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
};

const formatDuration = (mins?: number) => {
  if (!mins || mins <= 0) return "N/A";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

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
    const fallback = url.match(/[\w-]{11}/);
    return fallback?.[0] || null;
  } catch {
    return null;
  }
};

const MovieDetail: React.FC<Props> = ({ movieId }) => {
  const params = useParams<{ id?: string }>();
  const id = movieId || params.id;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cinemaMap, setCinemaMap] = useState<Map<string, ShowtimeData[]>>(
    new Map()
  );
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [allCinemas, setAllCinemas] = useState<Cinema[]>([]);
  const [cinemasLoading, setCinemasLoading] = useState(false);

  // Load movie details
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get<ApiResponse<any>>(`/api/movies/${id}`);
        if (cancelled) return;
        const payload = res.data.data;
        if (!payload) {
          setMovie(null);
        } else if (payload.movie) {
          setMovie(payload.movie as Movie);
        } else {
          setMovie(payload as Movie);
        }
      } catch (err) {
        const aErr = err as AxiosError;
        if (aErr?.response?.status === 404) {
          setNotFound(true);
          setMovie(null);
        } else if (aErr?.name === "CanceledError") {
          // cancelled
        } else {
          console.error("Failed to load movie detail", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load all cinemas
  useEffect(() => {
    let cancelled = false;
    const loadCinemas = async () => {
      setCinemasLoading(true);
      try {
        const res = await api.get<any>("/api/cinemas");
        if (cancelled) return;

        let data: Cinema[] = [];

        // Handle nested response structure: { success, data: { cinemas, pagination } }
        if (res.data?.data?.cinemas && Array.isArray(res.data.data.cinemas)) {
          data = res.data.data.cinemas;
        } else if (Array.isArray(res.data)) {
          data = res.data;
        } else if (
          res.data &&
          typeof res.data === "object" &&
          "data" in res.data &&
          Array.isArray(res.data.data)
        ) {
          data = res.data.data;
        }

        setAllCinemas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load cinemas:", err);
        setAllCinemas([]);
      } finally {
        if (!cancelled) setCinemasLoading(false);
      }
    };

    loadCinemas();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load showtimes for the movie
  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const loadShowtimes = async () => {
      setShowtimesLoading(true);
      try {
        const res = await api.get<ShowtimeData[] | ApiResponse<ShowtimeData[]>>(
          `/api/movies/${id}/showtimes`
        );

        if (cancelled) return;

        let data: ShowtimeData[] = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (
          res.data &&
          typeof res.data === "object" &&
          "data" in res.data
        ) {
          data = (res.data as any).data || [];
        }

        // Group showtimes by cinema
        const map = new Map<string, ShowtimeData[]>();
        data.forEach((showtime) => {
          const cinemaId = (showtime.cinemaId as any)?._id || showtime.cinemaId;
          if (!map.has(cinemaId)) {
            map.set(cinemaId, []);
          }
          map.get(cinemaId)!.push(showtime);
        });
        setCinemaMap(map);
      } catch (err) {
        console.error("Failed to load showtimes:", err);
        setCinemaMap(new Map());
      } finally {
        if (!cancelled) setShowtimesLoading(false);
      }
    };

    loadShowtimes();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        No movie selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">🎬</div>
        <h3 className="text-xl font-semibold text-gray-900">Movie not found</h3>
        <p className="mt-2 text-gray-500">
          The requested movie could not be found.
        </p>
        <Link
          to="/movies"
          className="mt-6 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 hover:shadow-lg"
        >
          Browse Movies
        </Link>
      </div>
    );
  }

  const videoId = movie.trailerUrl ? extractYouTubeId(movie.trailerUrl) : null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero Section with Poster */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="flex flex-col md:flex-row">
          {/* Poster */}
          <div className="relative flex-shrink-0 md:w-64">
            <div className="aspect-[2/3] w-full overflow-hidden md:rounded-l-2xl">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-700 text-slate-400">
                  <svg
                    className="h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Movie Info Overlay */}
          <div className="flex flex-1 flex-col justify-end p-6 md:p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {movie.title}
            </h1>

            {/* Meta Info */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {movie.rating && (
                <span className="rounded-md border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  {movie.rating}
                </span>
              )}
              <span className="text-sm text-slate-300">
                {formatDuration(movie.duration)}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-sm text-slate-300">
                {formatDate(movie.releaseDate)}
              </span>
              {movie.language && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-sm text-slate-300">
                    {movie.language}
                  </span>
                </>
              )}
            </div>

            {/* Genres */}
            {movie.genre && movie.genre.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genre.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Book Button */}
            <div className="mt-6">
              <Link
                to={`/showtimes?movieId=${movie._id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl active:scale-[0.98]"
              >
                <svg
                  className="h-5 w-5"
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
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-8 space-y-8">
        {/* Description */}
        {movie.description && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Synopsis</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              {movie.description}
            </p>
          </section>
        )}

        {/* Cast & Crew */}
        <section className="grid gap-6 sm:grid-cols-2">
          {/* Director */}
          {movie.director && (
            <div className="rounded-xl bg-gray-50 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Director
              </h3>
              <p className="mt-2 text-lg font-medium text-gray-900">
                {movie.director}
              </p>
            </div>
          )}

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <div className="rounded-xl bg-gray-50 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Starring
              </h3>
              <p className="mt-2 text-gray-700">
                {movie.cast.slice(0, 5).join(", ")}
                {movie.cast.length > 5 && ` +${movie.cast.length - 5} more`}
              </p>
            </div>
          )}
        </section>

        {/* Trailer */}
        {videoId && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Official Trailer
            </h2>
            <div className="mt-4 overflow-hidden rounded-xl bg-black shadow-2xl">
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="Movie Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                ></iframe>
              </div>
            </div>
          </section>
        )}

        {/* Watch Trailer Link Fallback */}
        {movie.trailerUrl && !videoId && (
          <section>
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Watch Trailer
            </a>
          </section>
        )}

        {/* Select Cinemas */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Select Cinemas
          </h2>
          {/* Cinema Cards */}
          {showtimesLoading || cinemasLoading ? (
            <div className="mt-6 flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allCinemas.map((cinema) => {
                const showtimesForCinema = cinemaMap.get(cinema._id) || [];
                const hasShowtimes = showtimesForCinema.length > 0;

                return (
                  <div
                    key={cinema._id}
                    className={`group relative rounded-xl border-2 transition-all ${
                      hasShowtimes
                        ? "border-green-400 bg-white shadow-md hover:shadow-lg hover:border-green-500 cursor-pointer"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    {hasShowtimes ? (
                      <Link to={`/cinemas/${cinema._id}`} className="block p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                              {cinema.name || "Unknown Cinema"}
                            </h3>
                            {cinema.location?.city && (
                              <p className="text-sm text-gray-500">
                                {cinema.location.city}
                              </p>
                            )}
                          </div>
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {showtimesForCinema.length} showtime
                            {showtimesForCinema.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {showtimesForCinema.slice(0, 3).map((st) => (
                            <span
                              key={st._id}
                              className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
                            >
                              {new Date(st.startTime).toLocaleTimeString(
                                "en-US",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          ))}
                          {showtimesForCinema.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{showtimesForCinema.length - 3} more
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-400">
                          {cinema.name || "Unknown Cinema"}
                        </h3>
                        {cinema.location?.city && (
                          <p className="text-sm text-gray-400">
                            {cinema.location.city}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-gray-400 italic">
                          No showtimes available
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MovieDetail;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { ApiResponse } from "../../services/api";
import { AxiosError } from "axios";
import { Movie } from "../../types/Movie";

type Props = { movieId?: string };

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
      </div>
    </div>
  );
};

export default MovieDetail;

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { ApiResponse } from "../../services/api";
import { AxiosError } from "axios";

type Movie = {
  _id: string;
  title: string;
  description?: string;
  genre?: string[];
  language?: string;
  duration?: number;
  releaseDate?: string;
  rating?: string;
  posterUrl?: string;
  cast?: string[];
  director?: string;
};

type Props = { movieId?: string };

const formatDate = (iso?: string) => {
  if (!iso) return "Unknown";
  try {
    return new Date(iso).toLocaleDateString();
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
        // API may return { data: movie } or { data: { movie } }
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
          // request was cancelled
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
      <div className="p-6 text-center text-sm text-gray-600">
        No movie selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="h-10 w-10 animate-spin text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
      </div>
    );
  }

  if (notFound || !movie) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold">Movie not found</h3>
        <p className="mt-2 text-sm text-gray-600">
          The requested movie could not be found or is unavailable.
        </p>
        <div className="mt-4">
          <Link
            to="/movies"
            className="rounded bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Back to movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="overflow-hidden rounded-lg bg-gray-100">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-80 w-full object-cover"
              />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-gray-500">
                No Image
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-gray-900">{movie.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {movie.genre && movie.genre.length > 0 ? (
              movie.genre.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {g}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                Unknown
              </span>
            )}

            <span className="text-sm text-gray-600">
              {formatDuration(movie.duration)}
            </span>
            {movie.rating && (
              <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {movie.rating}
              </span>
            )}
            <span className="text-sm text-gray-600">
              {formatDate(movie.releaseDate)}
            </span>
          </div>

          <div className="mt-6 space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="mb-1 text-sm font-semibold">Description</h4>
              <p className="whitespace-pre-line">
                {movie.description || "No description available."}
              </p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-semibold">Cast</h4>
              <p>
                {movie.cast && movie.cast.length > 0
                  ? movie.cast.join(", ")
                  : "N/A"}
              </p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-semibold">Director</h4>
              <p>{movie.director || "N/A"}</p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to={`/showtimes?movieId=${movie._id}`}
              className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Book Tickets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;

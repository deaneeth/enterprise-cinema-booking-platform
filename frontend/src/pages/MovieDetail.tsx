import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import ShowtimeList from "../components/showtimes/ShowtimeList";

interface Movie {
  _id: string;
  title: string;
  posterUrl?: string;
  genre?: string[];
  duration?: number; // in minutes
  rating?: string;
  description?: string;
  releaseDate?: string;
}

const MovieDetail: React.FC = () => {
  const { id: movieId } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;

    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{ success: boolean; data: Movie }>(
          `/api/movies/${movieId}`
        );
        setMovie(response.data.data);
        document.title = response.data.data.title || "Movie Detail";
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900">Movie Not Found</h2>
        <p className="mt-2 text-gray-600">
          {error || "The movie you're looking for doesn't exist."}
        </p>
      </div>
    );
  }

  const hours = movie.duration ? Math.floor(movie.duration / 60) : 0;
  const minutes = movie.duration ? movie.duration % 60 : 0;
  const duration =
    movie.duration && hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <main className="mx-auto max-w-6xl px-4">
        {/* Movie Info */}
        <div className="mb-8 flex flex-col gap-4 rounded-lg bg-white p-6 shadow-md md:flex-row">
          <div className="flex-shrink-0">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="h-64 w-44 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-64 w-44 items-center justify-center rounded-md bg-gray-200 text-sm text-gray-500">
                No Image
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col justify-between md:mt-0 md:ml-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{movie.title}</h1>
              <p className="mt-2 text-gray-600">{movie.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {movie.genre && movie.genre.length > 0
                  ? movie.genre.map((g) => (
                      <span
                        key={g}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                      >
                        {g}
                      </span>
                    ))
                  : null}
                {duration && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {duration}
                  </span>
                )}
                {movie.rating && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {movie.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Showtime List */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Showtimes
          </h2>
          <ShowtimeList movieId={movieId} />
        </div>
      </main>
    </div>
  );
};

export default MovieDetail;

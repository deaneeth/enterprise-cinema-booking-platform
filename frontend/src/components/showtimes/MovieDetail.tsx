// File: frontend/src/components/movies/MovieDetail.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import api from "../../services/api";
import { Movie } from "../../types/Movie";
import ShowtimeList from "../showtimes/ShowtimeList";

const MovieDetail: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();

  const { data, isLoading, error } = useQuery<Movie>(
    ["movie", movieId],
    async () => {
      const res = await api.get(`/api/movies/${movieId}`);
      return res.data.data;
    },
    {
      enabled: !!movieId,
    }
  );

  if (isLoading) {
    return <div className="py-20 text-center text-gray-500">Loading movie details...</div>;
  }

  if (error || !data) {
    return <div className="py-20 text-center text-red-500">Failed to load movie details.</div>;
  }

  const movie = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Movie Info Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-64 w-40 rounded-md object-cover shadow-sm"
          />
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">{movie.title}</h1>
          {movie.genre && (
            <div className="mt-1 text-sm text-gray-500">{movie.genre.join(", ")}</div>
          )}
          {movie.duration && (
            <div className="mt-1 text-sm text-gray-500">{movie.duration} min</div>
          )}
          {movie.language && (
            <div className="mt-1 text-sm text-gray-500">Language: {movie.language}</div>
          )}
          {movie.rating && (
            <div className="mt-1 text-sm text-gray-500">Rating: {movie.rating}</div>
          )}
          {movie.releaseDate && (
            <div className="mt-1 text-sm text-gray-500">
              Release Date: {new Date(movie.releaseDate).toLocaleDateString()}
            </div>
          )}
          {movie.description && (
            <p className="mt-3 text-gray-700">{movie.description}</p>
          )}
        </div>
      </div>

      {/* Showtime Section */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Available Showtimes</h2>
        <ShowtimeList movieId={movie._id} />
      </div>
    </div>
  );
};

export default MovieDetail;

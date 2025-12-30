import React from "react";
import { Link } from "react-router-dom";

type Movie = {
  _id: string;
  title: string;
  posterUrl?: string;
  duration?: number;
  genre?: string[];
  rating?: string;
};

type Props = { movie: Movie };

const MovieCard: React.FC<Props> = ({ movie }) => {
  const hours = movie.duration ? Math.floor(movie.duration / 60) : 0;
  const minutes = movie.duration ? movie.duration % 60 : 0;
  const duration = movie.duration
    ? hours > 0
      ? `${hours}h ${minutes}m`
      : `${minutes}m`
    : "N/A";

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-transform duration-150 hover:scale-105">
      <div className="overflow-hidden rounded-md bg-gray-100">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            No Image
          </div>
        )}
      </div>

      <div className="mt-3 px-2 pb-3">
        <h3 className="truncate text-sm font-semibold text-gray-900">
          {movie.title}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {movie.genre && movie.genre.length > 0 ? (
              movie.genre.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                >
                  {g}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                Unknown
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">{duration}</span>
            {movie.rating && (
              <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {movie.rating}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <Link
            to={`/movies/${movie._id}`}
            className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;

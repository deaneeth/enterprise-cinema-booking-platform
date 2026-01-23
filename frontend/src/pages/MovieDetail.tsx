import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import ShowtimeList from "../components/showtimes/ShowtimeList";
import { ReviewList } from "../components/reviews";

interface Movie {
  _id: string;
  title: string;
  posterUrl?: string;
  genre?: string[];
  duration?: number;
  rating?: string;
  description?: string;
  releaseDate?: string;
  director?: string;
  cast?: string[];
  language?: string;
}

const MovieDetail: React.FC = () => {
  const { id: movieId } = useParams<{ id: string }>();
  const location = useLocation();
  const reviewsRef = useRef<HTMLDivElement>(null);
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
          `/api/movies/${movieId}`,
        );
        const data = response.data.data;
        // Handle nested response
        const movieData = (data as any)?.movie || data;
        setMovie(movieData);
        document.title = movieData?.title ? `${movieData.title} | Cinema Booking` : "Movie Detail";
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  // Scroll to reviews section if URL hash is #reviews
  useEffect(() => {
    if (location.hash === "#reviews" && !loading && reviewsRef.current) {
      setTimeout(() => {
        reviewsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [location.hash, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f]">
        <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-gray-400 mb-6">
          {error || "The movie you're looking for doesn't exist."}
        </p>
        <Link
          to="/movies"
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
          Browse Movies
        </Link>
      </div>
    );
  }

  const hours = movie.duration ? Math.floor(movie.duration / 60) : 0;
  const minutes = movie.duration ? movie.duration % 60 : 0;
  const duration =
    movie.duration && hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Background */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {/* Background Image with Blur */}
        {movie.posterUrl && (
          <div className="absolute inset-0">
            <img
              src={movie.posterUrl}
              alt=""
              className="w-full h-full object-cover opacity-30 blur-sm scale-105"
            />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 to-transparent" />
        
        {/* Back Navigation */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Link
              to="/movies"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Movies
            </Link>
          </div>
        </div>

        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="mx-auto max-w-6xl px-4 pb-8">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster */}
              <div className="flex-shrink-0 w-48 md:w-56 -mb-24 relative z-20">
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full rounded-xl shadow-2xl shadow-black/50 border border-white/10"
                    style={{ aspectRatio: "2/3" }}
                  />
                ) : (
                  <div
                    className="w-full rounded-xl bg-gray-800 flex items-center justify-center border border-white/10"
                    style={{ aspectRatio: "2/3" }}
                  >
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title and Meta */}
              <div className="flex-1 md:pb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  {movie.title}
                </h1>

                {/* Meta badges */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {movie.rating && (
                    <span className="px-3 py-1 text-sm font-bold text-white border border-white/30 rounded">
                      {movie.rating}
                    </span>
                  )}
                  {duration && (
                    <span className="text-gray-300">{duration}</span>
                  )}
                  {movie.releaseDate && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-300">{formatDate(movie.releaseDate)}</span>
                    </>
                  )}
                  {movie.language && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-300">{movie.language}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 pt-32 pb-12">
        {/* Movie Details Card */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 mb-8">
          {/* Genres */}
          {movie.genre && movie.genre.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="px-4 py-1.5 text-sm font-medium text-gray-300 bg-white/10 rounded-full border border-white/10"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {movie.description && (
            <p className="text-lg leading-relaxed text-gray-300 mb-8">
              {movie.description}
            </p>
          )}

          {/* Director & Cast */}
          <div className="grid gap-6 sm:grid-cols-2 border-t border-white/10 pt-6">
            {movie.director && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Director
                </h3>
                <p className="text-white font-medium">{movie.director}</p>
              </div>
            )}
            {movie.cast && movie.cast.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Starring
                </h3>
                <p className="text-gray-300">
                  {movie.cast.slice(0, 4).join(", ")}
                  {movie.cast.length > 4 && ` +${movie.cast.length - 4} more`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Showtimes Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Showtimes
          </h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <ShowtimeList movieId={movieId} />
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" ref={reviewsRef} className="scroll-mt-20">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <ReviewList targetType="movie" targetId={movieId || ""} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MovieDetail;

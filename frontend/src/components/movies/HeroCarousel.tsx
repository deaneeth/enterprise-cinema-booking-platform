import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "../../types/Movie";

interface HeroCarouselProps {
  movies: Movie[];
  autoPlayInterval?: number;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  movies,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const featuredMovies = movies.slice(0, 5);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 700);
    },
    [isTransitioning]
  );

  const goToNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % featuredMovies.length;
    goToSlide(nextIndex);
  }, [currentIndex, featuredMovies.length, goToSlide]);

  const goToPrevious = useCallback(() => {
    const prevIndex =
      (currentIndex - 1 + featuredMovies.length) % featuredMovies.length;
    goToSlide(prevIndex);
  }, [currentIndex, featuredMovies.length, goToSlide]);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [goToNext, autoPlayInterval, featuredMovies.length]);

  if (featuredMovies.length === 0) return null;

  const currentMovie = featuredMovies[currentIndex];

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Background Images with Transition */}
      {featuredMovies.map((movie, index) => (
        <div
          key={movie._id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transform scale-105"
            style={{
              backgroundImage: movie.posterUrl
                ? `url(${movie.posterUrl})`
                : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            }}
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-black/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider">
              Now Showing
            </span>
            {currentMovie.rating && (
              <span className="px-2 py-1 border border-white/30 text-white/90 text-xs font-medium rounded">
                {currentMovie.rating}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            {currentMovie.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-white/70 text-sm">
            {currentMovie.genre && currentMovie.genre.length > 0 && (
              <span>{currentMovie.genre.slice(0, 3).join(" • ")}</span>
            )}
            {currentMovie.duration && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>
                  {Math.floor(currentMovie.duration / 60)}h{" "}
                  {currentMovie.duration % 60}m
                </span>
              </>
            )}
            {currentMovie.language && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>{currentMovie.language}</span>
              </>
            )}
          </div>

          {/* Description */}
          {currentMovie.description && (
            <p className="text-white/80 text-lg leading-relaxed max-w-xl line-clamp-3">
              {currentMovie.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/movies/${currentMovie._id}`)}
              className="group flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all duration-300 transform hover:scale-105"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Book Now
            </button>
            <button
              onClick={() => navigate(`/movies/${currentMovie._id}`)}
              className="flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {featuredMovies.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all duration-300 opacity-0 hover:opacity-100 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6"
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
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all duration-300 opacity-0 hover:opacity-100"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Preview */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-8 right-8 hidden lg:flex items-center gap-2">
          {featuredMovies.map((movie, index) => (
            <button
              key={movie._id}
              onClick={() => goToSlide(index)}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                index === currentIndex
                  ? "ring-2 ring-white scale-110"
                  : "opacity-50 hover:opacity-80"
              }`}
            >
              <img
                src={movie.posterUrl || "/placeholder-movie.jpg"}
                alt={movie.title}
                className="w-16 h-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;

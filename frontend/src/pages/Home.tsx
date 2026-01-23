import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import HeroCarousel from "../components/movies/HeroCarousel";
import api, { ApiResponse, getErrorMessage } from "../services/api";
import { Movie } from "../types/Movie";

interface ShowtimeResponse {
  _id: string;
  movieId: {
    _id: string;
    title: string;
    posterUrl: string;
    duration: number;
    rating: string;
  } | string;
  cinemaId: {
    _id: string;
    name: string;
  } | string;
  startTime: string;
  endTime: string;
  price: number;
  screenNumber: number;
  format?: string;
}

interface Showtime {
  _id: string;
  movie: {
    _id: string;
    title: string;
    posterUrl: string;
    duration: number;
    rating: string;
  };
  cinema: {
    _id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  price: number;
  screenNumber: number;
  format?: string;
}

const Home: React.FC = () => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [showtimesLoading, setShowtimesLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  // Generate next 7 days - memoized to prevent unnecessary recalculations
  const next7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date,
        dayName: i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" }),
        dateStr: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: date.toISOString().split("T")[0],
      });
    }
    return days;
  }, []);

  useEffect(() => {
    document.title = "CineFlick | Home";
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get<ApiResponse<any>>("/api/movies", {
          params: { limit: 5 },
        });
        const body = res.data;
        let moviesArr: Movie[] = [];
        if (body?.data) {
          if (Array.isArray(body.data)) {
            moviesArr = body.data as Movie[];
          } else if (body.data && Array.isArray(body.data.movies)) {
            moviesArr = body.data.movies as Movie[];
          }
        }
        setFeaturedMovies(moviesArr);
      } catch (err) {
        console.error("Failed to load featured movies:", getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch showtimes for selected day
  useEffect(() => {
    const fetchShowtimes = async () => {
      setShowtimesLoading(true);
      try {
        const selectedDate = next7Days[selectedDay].fullDate;
        const res = await api.get<ApiResponse<any>>("/api/showtimes", {
          params: { 
            date: selectedDate,
            limit: 12
          },
        });
        const body = res.data;
        let rawShowtimes: ShowtimeResponse[] = [];
        
        // Handle different API response formats
        if (body?.data) {
          if (Array.isArray(body.data)) {
            rawShowtimes = body.data;
          } else if (body.data && Array.isArray(body.data.showtimes)) {
            rawShowtimes = body.data.showtimes;
          }
        } else if (Array.isArray(body)) {
          // Direct array response
          rawShowtimes = body;
        }

        // Transform the response to match our Showtime interface
        const transformedShowtimes: Showtime[] = rawShowtimes
          .filter((st) => st.movieId && typeof st.movieId === 'object')
          .map((st) => ({
            _id: st._id,
            movie: typeof st.movieId === 'object' ? {
              _id: st.movieId._id,
              title: st.movieId.title || 'Unknown Movie',
              posterUrl: st.movieId.posterUrl || '',
              duration: st.movieId.duration || 0,
              rating: st.movieId.rating || 'NR',
            } : { _id: '', title: 'Unknown', posterUrl: '', duration: 0, rating: 'NR' },
            cinema: typeof st.cinemaId === 'object' ? {
              _id: st.cinemaId._id,
              name: st.cinemaId.name || 'Unknown Cinema',
            } : { _id: '', name: 'Unknown Cinema' },
            startTime: st.startTime,
            endTime: st.endTime,
            price: st.price,
            screenNumber: st.screenNumber,
            format: st.format,
          }));

        setShowtimes(transformedShowtimes);
      } catch (err) {
        console.error("Failed to load showtimes:", getErrorMessage(err));
        setShowtimes([]);
      } finally {
        setShowtimesLoading(false);
      }
    };
    fetchShowtimes();
  }, [selectedDay, next7Days]);

  // Group showtimes by movie
  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const movieId = showtime.movie._id;
    if (!acc[movieId]) {
      acc[movieId] = {
        movie: showtime.movie,
        showtimes: [],
      };
    }
    acc[movieId].showtimes.push(showtime);
    return acc;
  }, {} as Record<string, { movie: Showtime["movie"]; showtimes: Showtime[] }>);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Carousel Section */}
      {!loading && featuredMovies.length > 0 && (
        <HeroCarousel movies={featuredMovies} autoPlayInterval={6000} />
      )}

      {/* Loading State for Hero */}
      {loading && (
        <div className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] bg-gradient-to-b from-gray-900 to-[#0a0a0f] animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Quick Links Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="section-title mb-8">Explore</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Browse Movies Card */}
            <Link
              to="/movies"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/50 to-rose-900/50 p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Now Showing</h3>
                <p className="text-gray-400 text-sm">Browse all movies currently in theaters</p>
              </div>
            </Link>

            {/* Find Cinemas Card */}
            <Link
              to="/cinemas"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Find Cinemas</h3>
                <p className="text-gray-400 text-sm">Discover cinemas near you</p>
              </div>
            </Link>

            {/* My Bookings Card */}
            <Link
              to="/profile?tab=bookings"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/50 to-orange-900/50 p-8 border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-amber-400"
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
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">My Bookings</h3>
                <p className="text-gray-400 text-sm">View your tickets and booking history</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Showtimes Section - 7 Day View */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h2 className="section-title mb-4 md:mb-0">Upcoming Showtimes</h2>
            <Link
              to="/movies"
              className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1"
            >
              View all movies
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Day Selector */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
            {next7Days.map((day, index) => (
              <button
                key={day.fullDate}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                  selectedDay === index
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                <div className="text-sm font-medium">{day.dayName}</div>
                <div className={`text-xs ${selectedDay === index ? "text-white/80" : "text-gray-500"}`}>
                  {day.dateStr}
                </div>
              </button>
            ))}
          </div>

          {/* Showtimes Grid */}
          {showtimesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(groupedShowtimes).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No showtimes available</h3>
              <p className="text-gray-400">Check back later for upcoming shows on {next7Days[selectedDay].dayName}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(groupedShowtimes).map(({ movie, showtimes: movieShowtimes }) => (
                <div
                  key={movie._id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-4 p-4">
                    {/* Movie Poster */}
                    <Link to={`/movies/${movie._id}`} className="flex-shrink-0">
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-800">
                        {movie.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/movies/${movie._id}`}>
                        <h3 className="text-lg font-semibold text-white truncate hover:text-red-400 transition-colors">
                          {movie.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <span>{movie.duration} min</span>
                        {movie.rating && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{movie.rating}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Showtimes */}
                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {movieShowtimes.slice(0, 6).map((showtime) => (
                        <Link
                          key={showtime._id}
                          to={`/booking/${showtime._id}`}
                          className="px-3 py-2 bg-white/10 hover:bg-red-600 rounded-lg text-sm text-white transition-colors"
                        >
                          {new Date(showtime.startTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </Link>
                      ))}
                      {movieShowtimes.length > 6 && (
                        <Link
                          to={`/movies/${movie._id}`}
                          className="px-3 py-2 bg-white/5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          +{movieShowtimes.length - 6} more
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;

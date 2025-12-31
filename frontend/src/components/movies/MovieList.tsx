import React, { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import api, { ApiResponse, getErrorMessage } from "../../services/api";
import { Movie } from "../../types/Movie";
import { GENRES, LANGUAGES, RATINGS } from "../../constants/movie";

const MovieList: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [rating, setRating] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit };
        if (genre) params.genre = genre;
        if (language) params.language = language;
        if (rating) params.rating = rating;
        if (debouncedSearch) params.q = debouncedSearch;

        const res = await api.get<ApiResponse<any>>("/api/movies", {
          params,
        });
        const body = res.data;
        if (cancelled) return;
        // Support both response shapes:
        // 1) { success, data: { movies, pagination } }
        // 2) { success, data: Movie[] , pagination }
        let moviesArr: Movie[] = [];
        let pages = 1;

        if (body?.data) {
          // shape 2: data is an array of Movie
          if (Array.isArray(body.data)) {
            moviesArr = body.data as Movie[];
            pages = body.pagination?.pages ?? 1;
          }

          // shape 1: data is object { movies, pagination }
          else if (body.data && Array.isArray(body.data.movies)) {
            moviesArr = body.data.movies as Movie[];
            pages = body.data.pagination?.pages ?? 1;
          }
        }
        setMovies(moviesArr);
        setTotalPages(pages);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load movies:", getErrorMessage(err));
        setMovies([]);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, genre, language, rating, debouncedSearch]);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search movies..."
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:max-w-xs"
          />

          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={rating}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All ratings</option>
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <button
            onClick={() => {
              setSearch("");
              setGenre("");
              setLanguage("");
              setRating("");
              setPage(1);
            }}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm"
          >
            Reset
          </button>
          <div className="text-sm text-gray-600">
            Page {page} / {totalPages}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg
            className="h-8 w-8 animate-spin text-indigo-600"
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
      ) : movies.length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-600">
          No movies found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {movies.map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-md bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MovieList;

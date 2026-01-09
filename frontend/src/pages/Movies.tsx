import React, { useEffect } from "react";
import MovieList from "../components/movies/MovieList";

const Movies: React.FC = () => {
  useEffect(() => {
    document.title = "Now Showing";
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Now Showing</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="hidden md:block">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
              <p className="mt-2 text-sm text-gray-600">
                Use the controls in the list to filter and search movies.
              </p>
            </div>
          </aside>

          <section className="md:col-span-3">
            <MovieList />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Movies;

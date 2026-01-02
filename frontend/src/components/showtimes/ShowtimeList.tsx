import React, { useEffect, useState } from "react";
import api, { ApiResponse, getErrorMessage } from "../../services/api";
import { Showtime } from "../../types/Showtime";
import { format } from "date-fns";

interface ShowtimeListProps {
  movieId?: string;
  cinemaId?: string;
}

type DateGroups = Record<string, Showtime[]>;

const ShowtimeList: React.FC<ShowtimeListProps> = ({ movieId, cinemaId }) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<"today" | "tomorrow" | "week">("today");

  const [groupedShowtimes, setGroupedShowtimes] = useState<DateGroups>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        let url = "/api/showtimes";
        if (movieId) url = `/api/movies/${movieId}/showtimes`;
        else if (cinemaId) url = `/api/cinemas/${cinemaId}/showtimes`;

        const params: Record<string, string> = {};

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (dateFilter === "today") params.startDate = today.toISOString();
        if (dateFilter === "tomorrow") params.startDate = tomorrow.toISOString();
        if (dateFilter === "week") params.startDate = today.toISOString(); // can filter endDate later if API supports

        const res = await api.get<ApiResponse<Showtime[]>>(url, { params });
        if (cancelled) return;

        const data = res.data.data || [];
        setShowtimes(data);

        // group showtimes by date
        const groups: DateGroups = {};
        data.forEach((s) => {
          const dateKey = format(new Date(s.startTime), "yyyy-MM-dd");
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(s);
        });

        setGroupedShowtimes(groups);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load showtimes:", getErrorMessage(err));
        setShowtimes([]);
        setGroupedShowtimes({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [movieId, cinemaId, dateFilter]);

  const handleBook = (s: Showtime) => {
    // TODO: implement booking logic
    alert(`Book showtime at ${format(new Date(s.startTime), "HH:mm")}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Date Filter */}
      <div className="mb-4 flex gap-2">
        {(["today", "tomorrow", "week"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDateFilter(d)}
            className={`rounded-md px-3 py-2 text-sm ${
              dateFilter === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg
            className="h-8 w-8 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      ) : Object.keys(groupedShowtimes).length === 0 ? (
        <div className="py-20 text-center text-sm text-gray-600">No showtimes found</div>
      ) : (
        Object.keys(groupedShowtimes)
          .sort()
          .map((dateKey) => (
            <div key={dateKey} className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">{format(new Date(dateKey), "EEEE, MMM d")}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedShowtimes[dateKey].map((s) => (
                  <div
                    key={s._id}
                    className="flex flex-col justify-between rounded-md border border-gray-200 p-3 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {movieId ? (s.cinemaId as any)?.name : (s.movieId as any)?.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(s.startTime), "HH:mm")} | {s.format} | {s.language} | ${s.price} |{" "}
                        {s.availableSeats} seats
                      </div>
                    </div>
                    <button
                      onClick={() => handleBook(s)}
                      disabled={s.availableSeats === 0}
                      className="mt-2 rounded-md bg-indigo-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default ShowtimeList;

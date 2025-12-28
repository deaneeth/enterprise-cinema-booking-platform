import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api";

type CinemaLocation = {
  address?: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
};

export type Cinema = {
  _id: string;
  name: string;
  chain?: string;
  location?: CinemaLocation;
  facilities?: string[];
  screens?: number;
};

type GetCinemasResponse = {
  cinemas: Cinema[];
};

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
        aria-label="Loading"
      />
    </div>
  );
};

const CinemaList: React.FC = () => {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchCinemas = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await api.get("/api/cinemas");
        const payload = response.data as {
          success: boolean;
          data?: GetCinemasResponse;
          error?: { message: string };
        };

        if (!payload?.success) {
          throw new Error(payload?.error?.message || "Failed to fetch cinemas");
        }

        const fetchedCinemas = payload.data?.cinemas ?? [];
        if (isMounted) {
          setCinemas(fetchedCinemas);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
          setCinemas([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCinemas();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableCities = useMemo(() => {
    const cities = cinemas
      .map((c) => c.location?.city)
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      .map((c) => c.trim());

    return Array.from(new Set(cities)).sort((a, b) => a.localeCompare(b));
  }, [cinemas]);

  const filteredCinemas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedCity = selectedCity.trim().toLowerCase();

    return cinemas.filter((cinema) => {
      const cinemaName = cinema.name?.toLowerCase() ?? "";
      const cinemaCity = cinema.location?.city?.toLowerCase() ?? "";

      const matchesSearch =
        normalizedSearch.length === 0 || cinemaName.includes(normalizedSearch);
      const matchesCity =
        normalizedCity.length === 0 || cinemaCity === normalizedCity;

      return matchesSearch && matchesCity;
    });
  }, [cinemas, searchTerm, selectedCity]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-md">
          <label htmlFor="cinema-search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="cinema-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by cinema name"
            aria-label="Search cinemas by name"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="w-full md:w-64">
          <label htmlFor="cinema-city-filter" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <select
            id="cinema-city-filter"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Filter cinemas by city"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : filteredCinemas.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
          No cinemas found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {filteredCinemas.map((cinema) => (
            <Link
              key={cinema._id}
              to={`/cinemas/${cinema._id}`}
              className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {cinema.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {cinema.location?.city || "City not specified"}
                  </p>
                </div>
              </div>

              {Array.isArray(cinema.facilities) && cinema.facilities.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cinema.facilities.slice(0, 8).map((facility) => (
                    <span
                      key={facility}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No facilities listed</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CinemaList;

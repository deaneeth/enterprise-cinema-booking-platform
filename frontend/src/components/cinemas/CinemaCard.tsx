import React from "react";
import { Link } from "react-router-dom";
import type { Cinema } from "./CinemaList";

type Props = {
  cinema: Cinema;
};

const CinemaCard: React.FC<Props> = ({ cinema }) => {
  const city = cinema.location?.city || "City not specified";
  const address = cinema.location?.address || "Address not specified";
  const facilities = Array.isArray(cinema.facilities) ? cinema.facilities : [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {cinema.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{city}</p>
          <p className="mt-1 text-sm text-gray-600">{address}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Screens:</span>{" "}
          {typeof cinema.screens === "number" ? cinema.screens : "N/A"}
        </p>
        <Link
          to={`/cinemas/${cinema._id}`}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          View Details
        </Link>
      </div>

      {facilities.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {facilities.slice(0, 8).map((facility, index) => (
            <span
              key={`${facility}-${index}`}
              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {facility}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No facilities listed</p>
      )}
    </div>
  );
};

export default CinemaCard;

import React from "react";
import { useNavigate } from "react-router-dom";
import { Showtime } from "../../types/Showtime";
import Button from "../common/Button";
import { format } from "date-fns";

type Props = {
  showtime: Showtime;
};

const ShowtimeCard: React.FC<Props> = ({ showtime }) => {
  const navigate = useNavigate();

  const showtimeTime = format(new Date(showtime.startTime), "h:mm a");

  // Determine seat availability color
  let seatColor = "text-green-700 bg-green-100";
  if (showtime.availableSeats < 10) seatColor = "text-red-700 bg-red-100";
  else if (showtime.availableSeats < 50) seatColor = "text-yellow-700 bg-yellow-100";

  const isBookable =
    showtime.availableSeats > 0 && new Date(showtime.startTime) > new Date();

  const handleBookSeats = () => {
    if (isBookable) {
      navigate(`/showtimes/${showtime._id}/book`);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-150 hover:scale-105">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">{showtimeTime}</div>

        {showtime.format && (
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {showtime.format}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div>{showtime.language || "N/A"}</div>
        <div>${showtime.price.toFixed(2)}</div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${seatColor}`}
        >
          {showtime.availableSeats} seats available
        </div>

        <Button
          onClick={handleBookSeats}
          disabled={!isBookable}
          className="px-3 py-1.5 text-sm"
        >
          Book Seats
        </Button>
      </div>
    </div>
  );
};

export default ShowtimeCard;

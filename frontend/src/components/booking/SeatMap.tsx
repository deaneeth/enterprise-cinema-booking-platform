// SeatMap.tsx (Member 6)
// Seat map component - Displays interactive seat grid with real-time WebSocket updates
// Handles seat selection, hold/release, and communicates with booking flow

import React, { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import websocketClient from "../../services/websocket";
import { useAuth } from "../../contexts/AuthContext";
import Seat from "./Seat";

/* =======================
  Types and Interfaces
======================= */

export interface SeatData {
  _id: string;
  showtimeId: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: "regular" | "vip" | "wheelchair";
  status: "available" | "held" | "booked";
  heldBy?: string;
  heldUntil?: string;
  price: number;
}

interface SeatMapProps {
  showtimeId: string;
  selectedSeats: SeatData[];
  onSeatSelect: (seat: SeatData) => void;
  onSeatDeselect: (seatId: string) => void;
}

/* =======================
  SeatMap Component
======================= */

const SeatMap: React.FC<SeatMapProps> = ({
  showtimeId,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
}) => {
  const { currentUser } = useAuth();
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [seatsByRow, setSeatsByRow] = useState<{ [key: string]: SeatData[] }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectingUsers, setSelectingUsers] = useState<Map<string, string>>(
    new Map()
  );

  // Fetch seats on component mount
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<{
          success: boolean;
          data: {
            allSeats: SeatData[];
            seats: { [key: string]: SeatData[] };
          };
        }>(`/api/seats/showtime/${showtimeId}`);

        if (response.data.success && response.data.data) {
          const { allSeats, seats: groupedSeats } = response.data.data;
          setSeats(allSeats);
          setSeatsByRow(groupedSeats);

          // Restore seats held by current user to selectedSeats
          if (currentUser?.id) {
            const myHeldSeats = allSeats.filter(
              (seat) => seat.status === "held" && seat.heldBy === currentUser.id
            );
            myHeldSeats.forEach((seat) => {
              // Only add if not already in selectedSeats
              if (!selectedSeats.some((s) => s._id === seat._id)) {
                onSeatSelect(seat);
              }
            });
          }
        } else {
          setError("Failed to load seats");
        }
      } catch (err) {
        setError(getErrorMessage(err));
        console.error("Error fetching seats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId, currentUser?.id]);

  // WebSocket connection and event listeners
  useEffect(() => {
    // Connect to WebSocket
    if (!websocketClient?.isConnected?.()) {
      websocketClient?.connect();
    }
    websocketClient?.joinShowtime(showtimeId);

    const handleSeatUpdated = (data: any) => {
      // Update the specific seat that changed
      setSeats((prevSeats) =>
        prevSeats.map((seat) =>
          seat._id === data.seatId
            ? {
                ...seat,
                status: data.status,
                heldBy: data.heldBy,
                heldUntil: data.heldUntil,
              }
            : seat
        )
      );
      // Note: seatsByRow will auto-update via useEffect when seats changes

      // Track "Someone is selecting" UX
      if (
        data.status === "held" &&
        data.heldBy &&
        data.heldBy !== currentUser?.id
      ) {
        setSelectingUsers((prev) => {
          const updated = new Map(prev);
          updated.set(data.seatId, data.heldBy);
          return updated;
        });
      } else if (data.status === "available") {
        setSelectingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(data.seatId);
          return updated;
        });
      }
    };

    const handleSeatsRefresh = () => {
      // Refetch all seats
      const fetchSeats = async () => {
        try {
          const response = await api.get<{
            success: boolean;
            data: {
              allSeats: SeatData[];
              seats: { [key: string]: SeatData[] };
            };
          }>(`/api/seats/showtime/${showtimeId}`);

          if (response.data.success && response.data.data) {
            const { allSeats, seats: groupedSeats } = response.data.data;
            setSeats(allSeats);
            setSeatsByRow(groupedSeats);
          }
        } catch (err) {
          console.error("Error refreshing seats:", err);
        }
      };

      fetchSeats();
    };

    // Register WebSocket listeners
    websocketClient?.onSeatUpdated(handleSeatUpdated);
    websocketClient?.onSeatsRefresh(handleSeatsRefresh);

    // Track connection status
    const checkConnection = () => {
      setIsConnected(websocketClient?.isConnected?.() ?? false);
    };
    checkConnection();
    const connectionCheck = setInterval(checkConnection, 2000);

    return () => {
      websocketClient?.offSeatUpdated();
      websocketClient?.offSeatsRefresh();
      websocketClient?.leaveShowtime(showtimeId);
      clearInterval(connectionCheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId, currentUser?.id]);

  // Sync seatsByRow whenever seats array changes (fixes stale closure bug)
  useEffect(() => {
    if (seats.length > 0) {
      const grouped: { [key: string]: SeatData[] } = {};
      seats.forEach((seat) => {
        if (!grouped[seat.row]) {
          grouped[seat.row] = [];
        }
        grouped[seat.row].push(seat);
      });
      setSeatsByRow(grouped);
    }
  }, [seats]);

  // Hold timer countdown - shows shortest remaining time and auto-releases expired seats
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHoldTimer(null);
      return;
    }

    // Find seats with hold times
    const seatsWithHoldTime = selectedSeats.filter((s) => s.heldUntil);
    if (seatsWithHoldTime.length === 0) {
      setHoldTimer(null);
      return;
    }

    const interval = setInterval(async () => {
      const now = new Date().getTime();

      // Find expired seats and release them
      const expiredSeats = seatsWithHoldTime.filter((seat) => {
        const holdTime = new Date(seat.heldUntil!).getTime();
        return holdTime <= now;
      });

      // Auto-release expired seats
      if (expiredSeats.length > 0) {
        for (const seat of expiredSeats) {
          try {
            // Release on backend
            await api.put(`/api/seats/${seat._id}/release`).catch(() => {});
            // Update local state
            onSeatDeselect(seat._id);
            // Update seat status in local seats array
            setSeats((prevSeats) =>
              prevSeats.map((s) =>
                s._id === seat._id
                  ? {
                      ...s,
                      status: "available" as const,
                      heldBy: undefined,
                      heldUntil: undefined,
                    }
                  : s
              )
            );
            // Notify via WebSocket
            websocketClient?.releaseSeat(showtimeId, seat._id);
          } catch (err) {
            console.error(
              `Failed to auto-release seat ${seat.seatNumber}:`,
              err
            );
          }
        }
      }

      // Calculate shortest remaining time among non-expired held seats
      const activeSeats = seatsWithHoldTime.filter((seat) => {
        const holdTime = new Date(seat.heldUntil!).getTime();
        return holdTime > now;
      });

      if (activeSeats.length === 0) {
        setHoldTimer(null);
        clearInterval(interval);
        return;
      }

      const shortestTimeRemaining = activeSeats.reduce((shortest, seat) => {
        const holdTime = new Date(seat.heldUntil!).getTime();
        const remaining = Math.ceil((holdTime - now) / 1000);
        return remaining < shortest ? remaining : shortest;
      }, Infinity);

      if (shortestTimeRemaining <= 0 || shortestTimeRemaining === Infinity) {
        setHoldTimer(null);
        clearInterval(interval);
      } else {
        setHoldTimer(shortestTimeRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeats, showtimeId]);

  // Handle seat click
  const handleSeatClick = async (seat: SeatData) => {
    if (!currentUser?.id) {
      setError("User not authenticated");
      return;
    }

    const isSelected = selectedSeats.some((s) => s._id === seat._id);

    try {
      if (isSelected) {
        // Release seat
        await api.put(`/api/seats/${seat._id}/release`);
        onSeatDeselect(seat._id);
        websocketClient?.releaseSeat(showtimeId, seat._id);
      } else {
        // Hold seat
        const response = await api.put<{ success: boolean; data: SeatData }>(
          `/api/seats/${seat._id}/hold`
        );

        if (response.data.success) {
          onSeatSelect(response.data.data);
          websocketClient?.holdSeat(showtimeId, seat._id, currentUser.id);
        }
      }
    } catch (err) {
      console.error("Error toggling seat:", err);
      setError(getErrorMessage(err));
    }
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading seats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-medium">Error loading seats</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div className="seat-map-container">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Select Your Seats</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Premium Hold Timer */}
      {holdTimer !== null && (
        <div
          className="rounded-2xl p-4 mb-8 flex items-center justify-between backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Seats Reserved</p>
              <p className="text-sm text-gray-500">Complete your booking</p>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-light tracking-tight"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {formatTime(holdTimer)}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">remaining</p>
          </div>
        </div>
      )}

      {/* Premium Cinema Screen with Ambient Glow */}
      <div className="mb-10">
        {/* Screen Glow Effect */}
        <div className="relative flex justify-center">
          <div
            className="absolute -top-4 w-3/4 h-8 rounded-full blur-2xl opacity-60"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.6), rgba(196, 181, 253, 0.6), rgba(147, 197, 253, 0.6), transparent)",
            }}
          />
          <div
            className="absolute -top-2 w-2/3 h-6 rounded-full blur-xl opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
            }}
          />
        </div>

        {/* Main Screen */}
        <div className="relative">
          <div
            className="mx-auto h-3 rounded-b-full shadow-lg"
            style={{
              width: "85%",
              background:
                "linear-gradient(180deg, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)",
              boxShadow:
                "0 4px 20px rgba(100, 116, 139, 0.4), inset 0 -2px 4px rgba(0,0,0,0.2)",
              transform: "perspective(400px) rotateX(-15deg)",
            }}
          />
          {/* Screen Label */}
          <div className="text-center mt-3">
            <span
              className="text-xs font-medium tracking-[0.3em] uppercase"
              style={{ color: "#94a3b8" }}
            >
              Screen
            </span>
          </div>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="space-y-4 flex flex-col items-center">
          {rows.map((row) => (
            <div key={row} className="flex gap-2 items-center justify-center">
              {/* Row Label */}
              <div className="w-6 font-bold text-gray-600 text-center">
                {row}
              </div>

              {/* Seats */}
              <div className="flex gap-2">
                {seatsByRow[row]
                  ?.sort((a, b) => a.column - b.column)
                  .map((seat) => {
                    const isSelected = selectedSeats.some(
                      (s) => s._id === seat._id
                    );
                    const isHeldByOther =
                      seat.status === "held" && seat.heldBy !== currentUser?.id;
                    const isSomeoneSelecting = selectingUsers.has(seat._id);

                    return (
                      <Seat
                        key={seat._id}
                        id={seat._id}
                        seatNumber={seat.seatNumber}
                        row={seat.row}
                        column={seat.column}
                        status={seat.status}
                        seatType={seat.seatType}
                        price={seat.price}
                        isSelected={isSelected}
                        isHeldByOther={isHeldByOther}
                        isSomeoneSelecting={isSomeoneSelecting}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === "booked"}
                      />
                    );
                  })}
              </div>

              {/* Row Label */}
              <div className="w-6 font-bold text-gray-600 text-center">
                {row}
              </div>
            </div>
          ))}
        </div>

        {/* Premium Legend */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-6">
            {/* Available */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                  border: "1px solid #cbd5e1",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              />
              <span className="text-xs text-gray-500 font-medium">
                Available
              </span>
            </div>

            {/* Selected */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                }}
              />
              <span className="text-xs text-gray-500 font-medium">
                Selected
              </span>
            </div>

            {/* Held */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  boxShadow: "0 2px 6px rgba(251, 191, 36, 0.3)",
                }}
              />
              <span className="text-xs text-gray-500 font-medium">
                Reserved
              </span>
            </div>

            {/* Booked */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                }}
              />
              <span className="text-xs text-gray-500 font-medium">Sold</span>
            </div>

            {/* VIP */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md ring-1 ring-amber-400/60 relative"
                style={{
                  background:
                    "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                }}
              >
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">VIP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          {selectedSeats.length === 0
            ? "Click on a seat to select it"
            : `You have selected ${selectedSeats.length} seat(s)`}
        </p>
      </div>
    </div>
  );
};

export default SeatMap;

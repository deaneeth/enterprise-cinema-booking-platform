// SeatMap.tsx (Member 6)
// Seat map component - Displays interactive seat grid with real-time WebSocket updates
// Handles seat selection, hold/release, and communicates with booking flow

import React, { useEffect, useState, useCallback } from 'react';
import api, { getErrorMessage } from '../../services/api';
import websocketClient from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';
import Seat from './Seat';

/* =======================
  Types and Interfaces
======================= */

export interface SeatData {
  _id: string;
  showtimeId: string;
  seatNumber: string;
  row: string;
  column: number;
  seatType: 'regular' | 'vip' | 'wheelchair';
  status: 'available' | 'held' | 'booked';
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
  const [seatsByRow, setSeatsByRow] = useState<{ [key: string]: SeatData[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
        } else {
          setError('Failed to load seats');
        }
      } catch (err) {
        setError(getErrorMessage(err));
        console.error('Error fetching seats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

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
      updateSeatsByRow();
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
          console.error('Error refreshing seats:', err);
        }
      };

      fetchSeats();
    };

    // Register WebSocket listeners
    websocketClient?.onSeatUpdated(handleSeatUpdated);
    websocketClient?.onSeatsRefresh(handleSeatsRefresh);

    return () => {
      websocketClient?.offSeatUpdated();
      websocketClient?.offSeatsRefresh();
      websocketClient?.leaveShowtime(showtimeId);
    };
  }, [showtimeId]);

  // Update seatsByRow when seats change
  const updateSeatsByRow = useCallback(() => {
    const grouped: { [key: string]: SeatData[] } = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row]) {
        grouped[seat.row] = [];
      }
      grouped[seat.row].push(seat);
    });
    setSeatsByRow(grouped);
  }, [seats]);

  // Hold timer countdown
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHoldTimer(null);
      return;
    }

    const firstSelectedSeat = selectedSeats[0];
    if (!firstSelectedSeat.heldUntil) {
      setHoldTimer(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const holdTime = new Date(firstSelectedSeat.heldUntil!).getTime();
      const timeRemaining = Math.ceil((holdTime - now) / 1000);

      if (timeRemaining <= 0) {
        setHoldTimer(null);
        clearInterval(interval);
      } else {
        setHoldTimer(timeRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats]);

  // Handle seat click
  const handleSeatClick = async (seat: SeatData) => {
    if (!currentUser?.id) {
      setError('User not authenticated');
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
      console.error('Error toggling seat:', err);
      setError(getErrorMessage(err));
    }
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Hold Timer */}
      {holdTimer !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="font-medium text-blue-900">Seat Hold Timer</p>
              <p className="text-sm text-blue-700">
                Your seats are held for {formatTime(holdTimer)}
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {formatTime(holdTimer)}
          </div>
        </div>
      )}

      {/* Screen Indicator */}
      <div className="mb-6 text-center">
        <div className="inline-block bg-gray-400 text-white px-8 py-2 rounded-b-2xl font-medium">
          SCREEN
        </div>
      </div>

      {/* Seats Grid */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row} className="flex gap-2 items-center">
              {/* Row Label */}
              <div className="w-6 font-bold text-gray-600 text-center">{row}</div>

              {/* Seats */}
              <div className="flex gap-2 flex-wrap">
                {seatsByRow[row]
                  ?.sort((a, b) => a.column - b.column)
                  .map((seat) => {
                    const isSelected = selectedSeats.some((s) => s._id === seat._id);
                    const currentUser = (window as any).__userId; // From auth context
                    const isHeldByOther = seat.status === 'held' && seat.heldBy !== currentUser;

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
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === 'booked'}
                      />
                    );
                  })}
              </div>

              {/* Row Label */}
              <div className="w-6 font-bold text-gray-600 text-center">{row}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Legend:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-300 rounded border-2 border-gray-500"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded border-2 border-blue-800"></div>
              <span className="text-sm text-gray-600">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded border-2 border-yellow-600"></div>
              <span className="text-sm text-gray-600">Held</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded border-2 border-red-800"></div>
              <span className="text-sm text-gray-600">Booked</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Seat Types:</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span>👑</span>
                <span className="text-sm text-gray-600">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <span>♿</span>
                <span className="text-sm text-gray-600">Wheelchair</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Regular</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          {selectedSeats.length === 0
            ? 'Click on a seat to select it'
            : `You have selected ${selectedSeats.length} seat(s)`}
        </p>
      </div>
    </div>
  );
};

export default SeatMap;

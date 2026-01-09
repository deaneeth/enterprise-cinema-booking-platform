// Seat.tsx (Member 6)
// Individual seat component - Renders a single seat with status visualization
// Handles click events and displays seat information (number, type, price)

import React from 'react';

/* =======================
  Types and Interfaces
======================= */

interface SeatProps {
  id: string;
  seatNumber: string;
  row: string;
  column: number;
  status: 'available' | 'held' | 'booked';
  seatType: 'regular' | 'vip' | 'wheelchair';
  price: number;
  isSelected?: boolean;
  isHeldByOther?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/* =======================
  Seat Component
======================= */

const Seat: React.FC<SeatProps> = ({
  id,
  seatNumber,
  row,
  column,
  status,
  seatType,
  price,
  isSelected = false,
  isHeldByOther = false,
  onClick,
  disabled = false,
}) => {
  // Determine seat styling based on status and selection
  const getBackgroundColor = (): string => {
    if (isSelected) return 'bg-blue-600 border-blue-800';
    if (status === 'booked') return 'bg-red-600 border-red-800';
    if (isHeldByOther) return 'bg-yellow-400 border-yellow-600';
    if (status === 'available') return 'bg-gray-300 hover:bg-gray-400 border-gray-500';
    if (status === 'held') return 'bg-blue-400 border-blue-600';
    return 'bg-gray-300 border-gray-500';
  };

  // Determine cursor based on availability
  const getCursor = (): string => {
    if (disabled || status === 'booked' || isHeldByOther) return 'cursor-not-allowed';
    if (status === 'available') return 'cursor-pointer';
    return 'cursor-default';
  };

  // Get icon based on seat type
  const getSeatIcon = (): string => {
    if (seatType === 'vip') return '👑';
    if (seatType === 'wheelchair') return '♿';
    return '';
  };

  // Handle click with validation
  const handleClick = (): void => {
    if (!disabled && status !== 'booked' && !isHeldByOther && onClick) {
      onClick();
    }
  };

  return (
    <button
      id={`seat-${id}`}
      className={`
        relative w-10 h-10 rounded-md border-2 font-medium text-sm
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        ${getBackgroundColor()}
        ${getCursor()}
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400 shadow-lg' : ''}
        ${status === 'available' && !disabled ? 'hover:scale-110' : ''}
        ${disabled ? 'opacity-50' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
      `}
      onClick={handleClick}
      disabled={disabled || status === 'booked' || isHeldByOther}
      title={`${seatNumber} - ${status} - ₹${price}`}
      aria-label={`Seat ${seatNumber} ${status}`}
      data-seat-id={id}
      data-seat-number={seatNumber}
      data-seat-status={status}
    >
      {/* Seat Type Icon */}
      {getSeatIcon() && (
        <span className="absolute top-0 right-0 text-xs leading-none">
          {getSeatIcon()}
        </span>
      )}

      {/* Seat Number */}
      <span className={`text-xs font-bold ${
        status === 'booked' || (status === 'available' && !isSelected) ? 'text-black' : 'text-white'
      }`}>
        {seatNumber}
      </span>

      {/* Hold Indicator (if held by current user) */}
      {isSelected && status === 'held' && (
        <span className="absolute top-0.5 left-0.5 text-xs">⏱️</span>
      )}
    </button>
  );
};

export default Seat;

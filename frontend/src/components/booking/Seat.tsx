// Seat.tsx (Member 6)
// Individual seat component - Premium Apple-inspired design
// Refined aesthetics with subtle depth and smooth interactions

import React from "react";

/* =======================
  Types and Interfaces
======================= */

interface SeatProps {
  id: string;
  seatNumber: string;
  row: string;
  column: number;
  status: "available" | "held" | "booked";
  seatType: "regular" | "vip" | "wheelchair";
  price: number;
  isSelected?: boolean;
  isHeldByOther?: boolean;
  isSomeoneSelecting?: boolean;
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
  isSomeoneSelecting = false,
  onClick,
  disabled = false,
}) => {
  // Premium color palette with subtle gradients
  const getStyles = (): React.CSSProperties => {
    if (isSelected) {
      return {
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        boxShadow:
          "0 4px 14px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        border: "none",
      };
    }
    if (status === "booked") {
      return {
        background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
        border: "none",
      };
    }
    if (isHeldByOther || isSomeoneSelecting) {
      return {
        background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)",
        border: "none",
      };
    }
    if (status === "available") {
      return {
        background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
        border: "1px solid #cbd5e1",
      };
    }
    if (status === "held") {
      return {
        background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)",
        border: "none",
      };
    }
    return {
      background: "#e2e8f0",
      border: "1px solid #cbd5e1",
    };
  };

  // Determine cursor based on availability
  const getCursor = (): string => {
    if (disabled || status === "booked" || isHeldByOther)
      return "cursor-not-allowed";
    // Allow clicking on available seats, selected seats, and held seats (to release them)
    if (status === "available" || isSelected || status === "held") return "cursor-pointer";
    return "cursor-default";
  };

  // VIP indicator - subtle gold ring instead of emoji
  const isVip = seatType === "vip";
  const isWheelchair = seatType === "wheelchair";

  // Handle click with validation
  // Allow clicking on held seats (not by others) so user can release/re-select them
  const handleClick = (): void => {
    if (!disabled && status !== "booked" && !isHeldByOther && onClick) {
      onClick();
    }
  };

  // Text color based on background
  const getTextColor = (): string => {
    if (
      isSelected ||
      status === "held" ||
      isHeldByOther ||
      isSomeoneSelecting
    ) {
      return "text-white";
    }
    if (status === "booked") {
      return "text-slate-400";
    }
    return "text-slate-600";
  };

  return (
    <button
      id={`seat-${id}`}
      className={`
        relative w-9 h-9 rounded-lg font-medium text-xs
        transition-all duration-300 ease-out
        flex items-center justify-center
        ${getCursor()}
        ${isSelected ? "scale-105" : ""}
        ${status === "available" && !disabled ? "hover:scale-110 active:scale-95" : ""}
        ${disabled ? "opacity-40" : ""}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${isVip ? "ring-1 ring-amber-400/50" : ""}
      `}
      style={getStyles()}
      onClick={handleClick}
      disabled={disabled || status === "booked" || isHeldByOther}
      title={`${seatNumber} • ${seatType.toUpperCase()} • $${price}`}
      aria-label={`Seat ${seatNumber} ${status}`}
      data-seat-id={id}
      data-seat-number={seatNumber}
      data-seat-status={status}
    >
      {/* VIP indicator - subtle golden dot */}
      {isVip && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{
            background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
            boxShadow: "0 1px 3px rgba(245, 158, 11, 0.4)",
          }}
        />
      )}

      {/* Wheelchair indicator */}
      {isWheelchair && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400" />
      )}

      {/* Seat Number - clean typography */}
      <span className={`font-semibold ${getTextColor()}`}>{column}</span>

      {/* Selected checkmark overlay */}
      {isSelected && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center shadow-sm">
          <svg
            className="w-2 h-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}

      {/* Someone is selecting - subtle pulse ring */}
      {isSomeoneSelecting && (
        <span className="absolute inset-0 rounded-lg ring-2 ring-orange-400 animate-pulse" />
      )}
    </button>
  );
};

export default Seat;

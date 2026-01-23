// StarRating.tsx (Member 8)
// Star rating display and selector component
// Supports both display-only and interactive modes

import React, { useState } from "react";

interface StarRatingProps {
  rating: number;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = "medium",
  interactive = false,
  onChange,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Size classes for the stars
  const sizeClasses = {
    small: "text-sm",
    medium: "text-xl",
    large: "text-3xl",
  };

  // Calculate which star is displayed
  const getStarDisplay = (starIndex: number): "full" | "empty" => {
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    return starIndex <= displayRating ? "full" : "empty";
  };

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className={`flex ${sizeClasses[size]} ${interactive ? "cursor-pointer" : ""}`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <span
            key={starIndex}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            className={`
              ${interactive ? "transition-transform hover:scale-110" : ""}
              ${getStarDisplay(starIndex) === "full" ? "text-yellow-400" : "text-gray-300"}
            `}
            role={interactive ? "button" : "presentation"}
            aria-label={
              interactive ? `Rate ${starIndex} stars` : `${starIndex} star`
            }
          >
            ★
          </span>
        ))}
      </div>
      {showValue && (
        <span className="ml-1 text-sm text-gray-400">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
};

export default StarRating;

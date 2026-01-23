// MovieCardSkeleton.tsx (Phase 5 - UI Polish)
// Skeleton loading state for MovieCard component
// Matches the new dark theme Netflix-style card layout

import React from "react";

const MovieCardSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-900/50 animate-pulse max-w-[200px]">
      {/* Poster Skeleton */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }}>
        <div className="absolute inset-0 skeleton" />
        
        {/* Gradient Overlay Skeleton */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
        
        {/* Rating Badge Skeleton */}
        <div className="absolute top-2 right-2">
          <div className="w-8 h-4 rounded skeleton" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {/* Title Skeleton */}
        <div className="h-4 w-3/4 rounded skeleton mb-1" />
        
        {/* Meta Info Skeleton */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="h-3 w-14 rounded skeleton" />
          <div className="h-3 w-1 rounded-full bg-gray-700" />
          <div className="h-3 w-10 rounded skeleton" />
        </div>
        
        {/* Button Skeleton */}
        <div className="flex gap-2 mt-2">
          <div className="flex-1 h-7 rounded skeleton" />
          <div className="w-8 h-7 rounded skeleton" />
        </div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;

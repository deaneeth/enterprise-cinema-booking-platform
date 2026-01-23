// CinemaCardSkeleton.tsx (Phase 5 - UI Polish)
// Skeleton loading state for CinemaCard component
// Matches the dark theme layout of the actual CinemaCard

import React from "react";

const CinemaCardSkeleton: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-xl bg-white/5 border border-white/10 p-6 animate-pulse">
      {/* Icon Skeleton */}
      <div className="w-12 h-12 rounded-xl bg-white/10 mb-4" />

      {/* Cinema Name */}
      <div className="h-5 w-2/3 bg-white/10 rounded mb-2" />
      
      {/* City */}
      <div className="h-4 w-1/3 bg-white/10 rounded mb-4" />

      {/* Facilities */}
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-16 bg-white/10 rounded-full" />
        <div className="h-6 w-20 bg-white/10 rounded-full" />
        <div className="h-6 w-14 bg-white/10 rounded-full" />
      </div>
    </div>
  );
};

export default CinemaCardSkeleton;

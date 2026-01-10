// EmptyState.tsx (Member 6)
// Reusable empty state component
// Displays feedback when no data is available

import React from "react";

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  imageUrl?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Found",
  message,
  icon,
  action,
  imageUrl,
}) => {
  // Default empty state icon
  const defaultIcon = (
    <svg
      className="h-16 w-16 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon or Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="mb-4 h-32 w-32 object-contain opacity-60"
        />
      ) : (
        <div className="mb-4">{icon || defaultIcon}</div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>

      {/* Message */}
      <p className="mb-6 max-w-sm text-sm text-gray-500">{message}</p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                     transition-colors duration-200 hover:bg-indigo-700 focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

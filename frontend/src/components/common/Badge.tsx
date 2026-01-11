// Badge.tsx (Member 6)
// Reusable badge component
// Displays labels and tags with various styles

import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClick?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'secondary',
  size = 'md',
  icon,
  onClick,
  dismissible = false,
  onDismiss,
}) => {
  const variantStyles = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-300',
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    danger: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-cyan-100 text-cyan-800 border border-cyan-300',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-300',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const baseClass =
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200';

  const interactiveClass = onClick
    ? 'cursor-pointer hover:shadow-md active:scale-95'
    : '';

  return (
    <div
      className={`${baseClass} ${sizeStyles[size]} ${variantStyles[variant]} ${interactiveClass}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="flex-shrink-0 ml-1 hover:opacity-70 transition-opacity"
          aria-label="Remove badge"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Badge;

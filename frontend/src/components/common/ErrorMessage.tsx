// ErrorMessage.tsx (Member 6)
// Reusable error display component
// Shows error messages with optional dismiss action

import React, { useState } from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  onDismiss,
  type = 'error',
  showIcon = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-600',
      titleText: 'text-red-900',
      icon: '❌',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
      titleText: 'text-yellow-900',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      titleText: 'text-blue-900',
      icon: 'ℹ️',
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg p-4 flex items-start gap-3`}
      role="alert"
    >
      {showIcon && <span className="text-xl flex-shrink-0">{styles.icon}</span>}

      <div className="flex-grow">
        {title && <p className={`font-medium ${styles.titleText}`}>{title}</p>}
        <p className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
          {message}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

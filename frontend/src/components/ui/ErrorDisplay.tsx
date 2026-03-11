import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8">
      <div className="w-16 h-16 rounded-full bg-loss/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-loss"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Something went wrong
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            px-4 py-2 rounded-lg text-sm font-medium
            bg-[var(--accent)] text-white
            hover:bg-[var(--accent-hover)]
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2
          "
        >
          Try Again
        </button>
      )}
    </div>
  );
}

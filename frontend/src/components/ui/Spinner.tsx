import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        ${sizeClasses[size]}
        animate-spin rounded-full
        border-2 border-[var(--border)]
        border-t-[var(--accent)]
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading portfolio data...' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="lg" />
      <p className="text-[var(--text-secondary)] text-sm animate-pulse">{message}</p>
    </div>
  );
}

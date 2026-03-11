import React from 'react';

type BadgeVariant = 'gain' | 'loss' | 'neutral' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gain: 'bg-gain/10 text-gain border-gain/20',
  loss: 'bg-loss/10 text-loss border-loss/20',
  neutral: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

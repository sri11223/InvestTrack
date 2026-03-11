'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-[var(--bg-secondary)] border border-[var(--border)]
        hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)]
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2
        focus:ring-offset-[var(--bg-primary)]
      "
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </button>
  );
}

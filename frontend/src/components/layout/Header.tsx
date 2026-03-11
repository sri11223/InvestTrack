'use client';

import React from 'react';
import { BarChart3, RefreshCw, Search, Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Spinner } from '@/components/ui/Spinner';
import { formatTime } from '@/utils/formatters';

interface HeaderProps {
  lastUpdated: string | null;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onManualRefresh: () => void;
  onOpenSearch?: () => void;
}

export function Header({
  lastUpdated,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  onOpenSearch,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--accent)] text-white">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                InvestTrack
              </h1>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight hidden sm:block">
                Portfolio Dashboard
              </p>
            </div>
          </div>

          {/* Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Search / Add Stock */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90
                  transition-all duration-200 shadow-lg shadow-[var(--accent)]/25
                "
              >
                <Search className="w-3 h-3" />
                <span className="hidden sm:inline">Search</span>
                <Plus className="w-3 h-3" />
                <kbd className="hidden sm:inline ml-1 px-1 py-0.5 text-[9px] font-mono rounded bg-white/20">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              {isRefreshing ? (
                <Spinner size="sm" />
              ) : (
                <span className="live-indicator" />
              )}
              <span className="text-xs text-[var(--text-secondary)]">
                {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Connecting...'}
              </span>
            </div>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => onToggleAutoRefresh(!autoRefresh)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all duration-200
                ${
                  autoRefresh
                    ? 'bg-gain/10 text-gain border-gain/20 hover:bg-gain/20'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-secondary)]'
                }
              `}
              title={autoRefresh ? 'Auto-refresh ON (15s)' : 'Auto-refresh OFF'}
            >
              <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`}
                         style={autoRefresh ? { animationDuration: '3s' } : undefined} />
              <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="
                flex items-center justify-center w-10 h-10 rounded-lg
                bg-[var(--bg-secondary)] border border-[var(--border)]
                hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)]
                transition-all duration-200 disabled:opacity-50
                focus:outline-none focus:ring-2 focus:ring-[var(--accent)]
              "
              title="Refresh now"
            >
              <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

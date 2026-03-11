'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PortfolioSummaryCards } from '@/components/dashboard/PortfolioSummaryCards';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { SectorAllocationChart } from '@/components/dashboard/SectorAllocationChart';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { usePortfolio } from '@/hooks/usePortfolio';

export default function DashboardPage() {
  const {
    portfolio,
    status,
    error,
    lastUpdated,
    isRefreshing,
    refresh,
    autoRefresh,
    setAutoRefresh,
  } = usePortfolio();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onManualRefresh={refresh}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {status === 'loading' && <LoadingOverlay />}

        {/* Error State (no data yet) */}
        {status === 'error' && !portfolio && (
          <ErrorDisplay message={error || 'Failed to load portfolio'} onRetry={refresh} />
        )}

        {/* Portfolio Data */}
        {portfolio && (
          <div className="space-y-6 animate-fade-in">
            {/* Error banner when data exists but refresh failed */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-loss/10 border border-loss/20">
                <svg className="w-4 h-4 text-loss flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-loss">
                  {error} — Showing last known data.
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <PortfolioSummaryCards portfolio={portfolio} />

            {/* Chart & Table Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1">
                <SectorAllocationChart portfolio={portfolio} />
              </div>
              <div className="xl:col-span-2">
                {/* Optional: Add more widgets here in the future */}
              </div>
            </div>

            {/* Portfolio Table */}
            <PortfolioTable portfolio={portfolio} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

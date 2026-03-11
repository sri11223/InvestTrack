'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PortfolioSummaryCards } from '@/components/dashboard/PortfolioSummaryCards';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { SectorAllocationChart } from '@/components/dashboard/SectorAllocationChart';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { StockSearchModal } from '@/components/trading/StockSearchModal';
import { TradeModal } from '@/components/trading/TradeModal';
import { TradeCalculator } from '@/components/trading/TradeCalculator';
import { WatchlistPanel } from '@/components/trading/WatchlistPanel';
import { TradeHistoryPanel } from '@/components/trading/TradeHistoryPanel';
import { StockChart } from '@/components/trading/StockChart';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useToast } from '@/components/ui/Toast';
import { addToWatchlist, removeHolding } from '@/services/stockService';
import { StockSearchResult, TradeAction } from '@/types';

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

  const { toast } = useToast();

  // Modal states
  const [searchOpen, setSearchOpen] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeStock, setTradeStock] = useState<StockSearchResult | null>(null);
  const [tradeAction, setTradeAction] = useState<TradeAction>('BUY');
  const [tradeHolding, setTradeHolding] = useState<{ quantity: number; purchasePrice: number } | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
    refresh();
  }, [refresh]);

  // ── Keyboard shortcut: Ctrl+K / Cmd+K → open search ──────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Handlers ────────────────────────────────────────────────

  const handleBuy = useCallback((stock: StockSearchResult) => {
    setTradeStock(stock);
    setTradeAction('BUY');
    setTradeHolding(undefined);
    setTradeModalOpen(true);
    setSearchOpen(false);
  }, []);

  const handleSell = useCallback((stock: StockSearchResult, holding: { quantity: number; purchasePrice: number }) => {
    setTradeStock(stock);
    setTradeAction('SELL');
    setTradeHolding(holding);
    setTradeModalOpen(true);
  }, []);

  const handleAddToWatchlist = useCallback(async (stock: StockSearchResult) => {
    try {
      await addToWatchlist({
        nseCode: stock.nseCode,
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
      });
      setRefreshTrigger((n) => n + 1);
      toast(`${stock.name} added to watchlist`, 'success');
    } catch {
      toast('Failed to add to watchlist', 'error');
    }
  }, [toast]);

  const handleRemoveHolding = useCallback(async (id: string) => {
    if (!confirm('Remove this holding from your portfolio?')) return;
    try {
      await removeHolding(id);
      triggerRefresh();
      toast('Holding removed successfully', 'success');
    } catch {
      toast('Failed to remove holding', 'error');
    }
  }, [triggerRefresh, toast]);

  const handleTradeComplete = useCallback(() => {
    triggerRefresh();
    toast('Trade executed successfully!', 'success');
  }, [triggerRefresh, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onManualRefresh={refresh}
        onOpenSearch={() => setSearchOpen(true)}
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

            {/* Top Movers */}
            <TopMovers portfolio={portfolio} />

            {/* Chart + Sidebar Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left: Chart + Sector */}
              <div className="xl:col-span-3 space-y-6">
                {/* Stock Chart */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-[var(--text-primary)]">Portfolio Trend</h3>
                  </CardHeader>
                  <CardBody>
                    <StockChart symbol="Portfolio" data={[]} height={280} />
                  </CardBody>
                </Card>

                <SectorAllocationChart portfolio={portfolio} />
              </div>

              {/* Right: Trading Sidebar */}
              <div className="xl:col-span-1 space-y-6">
                <TradeCalculator />
                <WatchlistPanel
                  onBuyStock={handleBuy}
                  onOpenSearch={() => setSearchOpen(true)}
                  refreshTrigger={refreshTrigger}
                />
                <TradeHistoryPanel refreshTrigger={refreshTrigger} />
              </div>
            </div>

            {/* Portfolio Table */}
            <PortfolioTable
              portfolio={portfolio}
              onBuy={handleBuy}
              onSell={handleSell}
              onRemove={handleRemoveHolding}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <StockSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectBuy={handleBuy}
        onAddToWatchlist={handleAddToWatchlist}
      />
      <TradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        stock={tradeStock}
        defaultAction={tradeAction}
        currentHolding={tradeHolding}
        onTradeComplete={handleTradeComplete}
      />
    </div>
  );
}

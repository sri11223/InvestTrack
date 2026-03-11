'use client';

import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PortfolioSummaryCards } from '@/components/dashboard/PortfolioSummaryCards';
import { PortfolioTable } from '@/components/dashboard/PortfolioTable';
import { LoadingOverlay } from '@/components/ui/Spinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { StockSearchModal } from '@/components/trading/StockSearchModal';
import { TradeModal } from '@/components/trading/TradeModal';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { DraggableWidget, WidgetSettings } from '@/components/ui/DraggableWidget';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useDashboardLayout, WidgetConfig } from '@/hooks/useDashboardLayout';
import { useToast } from '@/components/ui/Toast';
import { addToWatchlist, removeHolding } from '@/services/stockService';
import { StockSearchResult, TradeAction, PortfolioStock } from '@/types';

// ── Lazy-loaded sidebar/secondary widgets ───────────────────
const SectorAllocationChart = lazy(() => import('@/components/dashboard/SectorAllocationChart').then(m => ({ default: m.SectorAllocationChart })));
const StockChart = lazy(() => import('@/components/trading/StockChart').then(m => ({ default: m.StockChart })));
const TradeCalculator = lazy(() => import('@/components/trading/TradeCalculator').then(m => ({ default: m.TradeCalculator })));
const WatchlistPanel = lazy(() => import('@/components/trading/WatchlistPanel').then(m => ({ default: m.WatchlistPanel })));
const TradeHistoryPanel = lazy(() => import('@/components/trading/TradeHistoryPanel').then(m => ({ default: m.TradeHistoryPanel })));
const PriceAlerts = lazy(() => import('@/components/trading/PriceAlerts').then(m => ({ default: m.PriceAlerts })));
const StockCompare = lazy(() => import('@/components/dashboard/StockCompare').then(m => ({ default: m.StockCompare })));
const MarketSentiment = lazy(() => import('@/components/dashboard/MarketSentiment').then(m => ({ default: m.MarketSentiment })));
const PerformanceAnalytics = lazy(() => import('@/components/dashboard/PerformanceAnalytics').then(m => ({ default: m.PerformanceAnalytics })));

function WidgetSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Default widget layout ───────────────────────────────────
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'summary', label: 'Summary Cards', visible: true },
  { id: 'movers', label: 'Top Movers', visible: true },
  { id: 'chart', label: 'Portfolio Trend', visible: true },
  { id: 'sector', label: 'Sector Allocation', visible: true },
  { id: 'analytics', label: 'Performance Analytics', visible: true },
  { id: 'compare', label: 'Stock Comparison', visible: true },
  { id: 'sentiment', label: 'Market Sentiment', visible: true },
  { id: 'calculator', label: 'P&L Calculator', visible: true },
  { id: 'watchlist', label: 'Watchlist', visible: true },
  { id: 'alerts', label: 'Price Alerts', visible: true },
  { id: 'history', label: 'Trade History', visible: true },
  { id: 'holdings', label: 'Portfolio Holdings', visible: true },
];

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
  const { widgets, handleDragStart, handleDragEnter, handleDragEnd, toggleWidget, resetLayout } = useDashboardLayout(DEFAULT_WIDGETS);

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

  // ── Derived data for new widgets ──────────────────────────
  const allStocks = useMemo<PortfolioStock[]>(() => {
    if (!portfolio) return [];
    return portfolio.sectors.flatMap((s) => s.stocks);
  }, [portfolio]);

  const currentPrices = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allStocks) {
      if (s.cmp > 0) map.set(s.nseCode, s.cmp);
    }
    return map;
  }, [allStocks]);

  const stockCodes = useMemo(() => {
    return allStocks.map((s) => ({ nseCode: s.nseCode, name: s.name }));
  }, [allStocks]);

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

  // ── Widget visibility helper ──────────────────────────────
  const isVisible = useCallback((id: string) => widgets.find((w) => w.id === id)?.visible ?? true, [widgets]);
  const widgetIndex = useCallback((id: string) => widgets.findIndex((w) => w.id === id), [widgets]);

  // ── Widget renderer ───────────────────────────────────────
  const renderWidget = useCallback((id: string, content: React.ReactNode) => {
    const idx = widgetIndex(id);
    const w = widgets[idx];
    if (!w?.visible) return null;
    return (
      <DraggableWidget
        key={id}
        id={id}
        label={w.label}
        index={idx}
        visible={w.visible}
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragEnd={handleDragEnd}
        onToggleVisibility={toggleWidget}
      >
        <ErrorBoundary fallbackMessage={`Failed to load ${w.label}`}>
          {content}
        </ErrorBoundary>
      </DraggableWidget>
    );
  }, [widgets, widgetIndex, handleDragStart, handleDragEnter, handleDragEnd, toggleWidget]);

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

            {/* Widget Settings */}
            <div className="flex justify-end">
              <WidgetSettings widgets={widgets} onToggle={toggleWidget} onReset={resetLayout} />
            </div>

            {/* ── Main Dashboard Widgets (drag-and-drop) ─── */}
            {widgets.filter((w) => ['summary', 'movers'].includes(w.id) && w.visible).map((w) => {
              if (w.id === 'summary') return renderWidget('summary', <PortfolioSummaryCards portfolio={portfolio} />);
              if (w.id === 'movers') return renderWidget('movers', <TopMovers portfolio={portfolio} />);
              return null;
            })}

            {/* ── Two-column Grid with draggable widgets ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left column: 3/4 width */}
              <div className="xl:col-span-3 space-y-6">
                {widgets.filter((w) => ['chart', 'sector', 'analytics', 'compare'].includes(w.id) && w.visible).map((w) => {
                  if (w.id === 'chart') return renderWidget('chart',
                    <Card>
                      <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Portfolio Trend</h3></CardHeader>
                      <CardBody>
                        <Suspense fallback={<WidgetSpinner />}>
                          <StockChart symbol="Portfolio" data={[]} height={280} />
                        </Suspense>
                      </CardBody>
                    </Card>
                  );
                  if (w.id === 'sector') return renderWidget('sector',
                    <Suspense fallback={<WidgetSpinner />}>
                      <SectorAllocationChart portfolio={portfolio} />
                    </Suspense>
                  );
                  if (w.id === 'analytics') return renderWidget('analytics',
                    <Card>
                      <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Performance Analytics</h3></CardHeader>
                      <CardBody>
                        <Suspense fallback={<WidgetSpinner />}>
                          <PerformanceAnalytics portfolio={portfolio} />
                        </Suspense>
                      </CardBody>
                    </Card>
                  );
                  if (w.id === 'compare') return renderWidget('compare',
                    <Card>
                      <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Stock Comparison</h3></CardHeader>
                      <CardBody>
                        <Suspense fallback={<WidgetSpinner />}>
                          <StockCompare portfolio={portfolio} />
                        </Suspense>
                      </CardBody>
                    </Card>
                  );
                  return null;
                })}
              </div>

              {/* Right column: 1/4 width sidebar */}
              <div className="xl:col-span-1 space-y-6">
                {widgets.filter((w) => ['sentiment', 'calculator', 'watchlist', 'alerts', 'history'].includes(w.id) && w.visible).map((w) => {
                  if (w.id === 'sentiment') return renderWidget('sentiment',
                    <Card>
                      <CardHeader><h3 className="font-semibold text-[var(--text-primary)]">Portfolio Sentiment</h3></CardHeader>
                      <CardBody>
                        <Suspense fallback={<WidgetSpinner />}>
                          <MarketSentiment portfolio={portfolio} />
                        </Suspense>
                      </CardBody>
                    </Card>
                  );
                  if (w.id === 'calculator') return renderWidget('calculator',
                    <Suspense fallback={<WidgetSpinner />}><TradeCalculator /></Suspense>
                  );
                  if (w.id === 'watchlist') return renderWidget('watchlist',
                    <Suspense fallback={<WidgetSpinner />}>
                      <WatchlistPanel onBuyStock={handleBuy} onOpenSearch={() => setSearchOpen(true)} refreshTrigger={refreshTrigger} />
                    </Suspense>
                  );
                  if (w.id === 'alerts') return renderWidget('alerts',
                    <Suspense fallback={<WidgetSpinner />}>
                      <PriceAlerts currentPrices={currentPrices} stockCodes={stockCodes} />
                    </Suspense>
                  );
                  if (w.id === 'history') return renderWidget('history',
                    <Suspense fallback={<WidgetSpinner />}><TradeHistoryPanel refreshTrigger={refreshTrigger} /></Suspense>
                  );
                  return null;
                })}
              </div>
            </div>

            {/* ── Portfolio Holdings Table (always at bottom) ─── */}
            {isVisible('holdings') && renderWidget('holdings',
              <PortfolioTable
                portfolio={portfolio}
                onBuy={handleBuy}
                onSell={handleSell}
                onRemove={handleRemoveHolding}
              />
            )}
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

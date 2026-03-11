import { useState, useCallback, useEffect, useRef } from 'react';
import { PortfolioSummary, DataStatus } from '@/types';
import { fetchPortfolio } from '@/services/stockService';
import { useInterval } from './useInterval';
import { REFRESH_INTERVAL_MS } from '@/constants';

interface UsePortfolioReturn {
  portfolio: PortfolioSummary | null;
  status: DataStatus;
  error: string | null;
  lastUpdated: string | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
}

/**
 * Primary hook for managing portfolio data lifecycle.
 * Handles initial fetch, auto-refresh, error state, and manual refresh.
 */
export function usePortfolio(): UsePortfolioReturn {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [status, setStatus] = useState<DataStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Prevent duplicate fetches
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // Only show loading on initial load, not on refreshes
      if (!portfolio) {
        setStatus('loading');
      }
      setIsRefreshing(true);
      setError(null);

      const data = await fetchPortfolio();

      setPortfolio(data);
      setStatus('success');
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch portfolio data';
      setError(message);

      // Only set error status if we have no existing data
      if (!portfolio) {
        setStatus('error');
      }
    } finally {
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [portfolio]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 15 seconds
  useInterval(
    () => {
      refresh();
    },
    autoRefresh ? REFRESH_INTERVAL_MS : null
  );

  return {
    portfolio,
    status,
    error,
    lastUpdated,
    isRefreshing,
    refresh,
    autoRefresh,
    setAutoRefresh,
  };
}

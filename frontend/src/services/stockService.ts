import apiClient from '@/utils/api';
import {
  ApiResponse,
  PortfolioSummary,
  StockSearchResult,
  StockHolding,
  Trade,
  TradeRequest,
  TradeCalculation,
  WatchlistItem,
} from '@/types';

// ─── Portfolio ──────────────────────────────────────────────────────────────

export async function fetchPortfolio(): Promise<PortfolioSummary> {
  const response = await apiClient.get<ApiResponse<PortfolioSummary>>('/stocks/portfolio');
  return response.data.data;
}

export async function fetchHealthStatus(): Promise<{
  status: string;
  uptime: number;
  timestamp: string;
}> {
  const response = await apiClient.get('/health');
  return response.data;
}

// ─── Search ─────────────────────────────────────────────────────────────────

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const response = await apiClient.get<ApiResponse<StockSearchResult[]>>('/trades/search', {
    params: { q: query },
  });
  return response.data.data;
}

// ─── Holdings CRUD ──────────────────────────────────────────────────────────

export async function fetchHoldings(): Promise<StockHolding[]> {
  const response = await apiClient.get<ApiResponse<StockHolding[]>>('/trades/holdings');
  return response.data.data;
}

export async function addHolding(holding: Omit<StockHolding, 'id'>): Promise<StockHolding> {
  const response = await apiClient.post<ApiResponse<StockHolding>>('/trades/holdings', holding);
  return response.data.data;
}

export async function removeHolding(id: string): Promise<void> {
  await apiClient.delete(`/trades/holdings/${encodeURIComponent(id)}`);
}

// ─── Trades ─────────────────────────────────────────────────────────────────

export async function executeTrade(trade: TradeRequest): Promise<{ trade: Trade; holding: StockHolding }> {
  const response = await apiClient.post<ApiResponse<{ trade: Trade; holding: StockHolding }>>('/trades/execute', trade);
  return response.data.data;
}

export async function fetchTradeHistory(): Promise<Trade[]> {
  const response = await apiClient.get<ApiResponse<Trade[]>>('/trades/history');
  return response.data.data;
}

export async function calculateTrade(buyPrice: number, sellPrice: number, quantity: number): Promise<TradeCalculation> {
  const response = await apiClient.post<ApiResponse<TradeCalculation>>('/trades/calculate', {
    buyPrice,
    sellPrice,
    quantity,
  });
  return response.data.data;
}

// ─── Watchlist ──────────────────────────────────────────────────────────────

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const response = await apiClient.get<ApiResponse<WatchlistItem[]>>('/trades/watchlist');
  return response.data.data;
}

export async function addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): Promise<WatchlistItem> {
  const response = await apiClient.post<ApiResponse<WatchlistItem>>('/trades/watchlist', item);
  return response.data.data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/trades/watchlist/${encodeURIComponent(id)}`);
}

// ─── Stock & Portfolio Types (Frontend) ──────────────────────────────────────

export interface StockHolding {
  id: string;
  name: string;
  symbol: string;
  nseCode: string;
  bseCode: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;
}

export interface PortfolioStock extends StockHolding {
  cmp: number;
  investment: number;
  presentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  portfolioWeight: number;
  peRatio: number | null;
  latestEarnings: string | null;
  dayChange: number;
  dayChangePercent: number;
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  stockCount: number;
  stocks: PortfolioStock[];
}

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  sectors: SectorSummary[];
  lastUpdated: string;
}

// ─── Trade Types ────────────────────────────────────────────────────────────

export type TradeAction = 'BUY' | 'SELL';

export interface Trade {
  id: string;
  holdingId: string;
  symbol: string;
  nseCode: string;
  name: string;
  action: TradeAction;
  price: number;
  quantity: number;
  totalValue: number;
  date: string;
  notes?: string;
}

export interface TradeRequest {
  symbol?: string;
  nseCode: string;
  name: string;
  sector: string;
  bseCode?: string;
  action: TradeAction;
  price: number;
  quantity: number;
  notes?: string;
}

export interface TradeCalculation {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  investment: number;
  returns: number;
  profit: number;
  profitPercent: number;
  breakEvenPrice: number;
}

// ─── Search Types ───────────────────────────────────────────────────────────

export interface StockSearchResult {
  symbol: string;
  nseCode: string;
  name: string;
  sector: string;
  exchange: string;
  cmp?: number | null;
}

// ─── Watchlist Types ────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  nseCode: string;
  symbol: string;
  name: string;
  sector: string;
  addedAt: string;
  targetPrice?: number;
  notes?: string;
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  cached?: boolean;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
}

// ─── UI Types ───────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof PortfolioStock;
  direction: SortDirection;
}

export type DataStatus = 'idle' | 'loading' | 'success' | 'error';

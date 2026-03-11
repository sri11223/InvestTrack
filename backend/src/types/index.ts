// ─── Stock & Portfolio Types ─────────────────────────────────────────────────

export interface StockHolding {
  id: string;            // Unique ID for this holding
  name: string;
  symbol: string;        // e.g., "HDFCBANK.NS"
  nseCode: string;
  bseCode: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
  purchaseDate: string;  // ISO date string
  notes?: string;
}

export interface StockQuote {
  symbol: string;
  cmp: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  lastUpdated: string;
}

export interface StockFundamentals {
  symbol: string;
  cmp: number | null;
  change: number | null;
  changePercent: number | null;
  peRatio: number | null;
  latestEarnings: string | null;
  marketCap: string | null;
  weekHigh52: number | null;
  weekLow52: number | null;
  lastUpdated: string;
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
  symbol: string;
  nseCode: string;
  name: string;
  sector: string;
  bseCode: string;
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

// ─── Chart Types ────────────────────────────────────────────────────────────

export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataResponse {
  symbol: string;
  period: string;
  data: CandlestickData[];
  lastUpdated: string;
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

// ─── Cache Types ────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

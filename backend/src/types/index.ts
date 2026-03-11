// ─── Stock & Portfolio Types ─────────────────────────────────────────────────

export interface StockHolding {
  name: string;
  symbol: string;       // Yahoo Finance symbol (e.g., "HDFCBANK.NS")
  nseCode: string;
  bseCode: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
}

export interface StockQuote {
  symbol: string;
  cmp: number;          // Current Market Price
  change: number;       // Absolute change
  changePercent: number; // Percentage change
  dayHigh: number;
  dayLow: number;
  volume: number;
  lastUpdated: string;
}

export interface StockFundamentals {
  symbol: string;
  peRatio: number | null;
  latestEarnings: string | null;
  marketCap: string | null;
  weekHigh52: number | null;
  weekLow52: number | null;
  lastUpdated: string;
}

export interface PortfolioStock extends StockHolding {
  cmp: number;
  investment: number;      // purchasePrice * quantity
  presentValue: number;    // cmp * quantity
  gainLoss: number;        // presentValue - investment
  gainLossPercent: number;
  portfolioWeight: number; // percentage of total portfolio
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

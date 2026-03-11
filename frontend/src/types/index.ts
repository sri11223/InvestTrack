// ─── Stock & Portfolio Types (Frontend) ──────────────────────────────────────

export interface StockHolding {
  name: string;
  symbol: string;
  nseCode: string;
  bseCode: string;
  sector: string;
  purchasePrice: number;
  quantity: number;
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

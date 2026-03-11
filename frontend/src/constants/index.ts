/** Auto-refresh interval in milliseconds (15 seconds as per requirements) */
export const REFRESH_INTERVAL_MS = 15_000;

/** API base URL — pulled from environment */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** Sector display colors for charts and badges */
export const SECTOR_COLORS: Record<string, string> = {
  Financials: '#3b82f6',
  Technology: '#8b5cf6',
  Healthcare: '#06b6d4',
  'Consumer Goods': '#f59e0b',
  Energy: '#ef4444',
  Automobile: '#10b981',
};

/** Sector icons (Lucide icon names) */
export const SECTOR_ICONS: Record<string, string> = {
  Financials: 'landmark',
  Technology: 'cpu',
  Healthcare: 'heart-pulse',
  'Consumer Goods': 'shopping-bag',
  Energy: 'zap',
  Automobile: 'car',
};

/** Number formatting locale */
export const LOCALE = 'en-IN';

/** Currency code */
export const CURRENCY = 'INR';

import { LOCALE, CURRENCY } from '@/constants';

/**
 * Formats a number as Indian Rupee currency.
 * e.g., 150000 → ₹1,50,000.00
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number as compact currency (for large values).
 * e.g., 1500000 → ₹15.00L
 */
export function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (absValue >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)}L`;
  }
  if (absValue >= 1_000) {
    return `₹${(value / 1_000).toFixed(2)}K`;
  }
  return formatCurrency(value);
}

/**
 * Formats a percentage value with sign.
 * e.g., 12.345 → +12.35%, -3.2 → -3.20%
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formats a plain number with Indian number system grouping.
 * e.g., 1234567 → 12,34,567
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a number as volume (compact).
 * e.g., 12345678 → 1.23Cr
 */
export function formatVolume(value: number): string {
  if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(2)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Formats a date string to a readable format.
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats time only from a date string.
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

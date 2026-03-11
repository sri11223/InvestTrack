import { PortfolioStock, SectorSummary } from '@/types';

/**
 * Calculates investment value.
 */
export function calcInvestment(purchasePrice: number, quantity: number): number {
  return purchasePrice * quantity;
}

/**
 * Calculates present value.
 */
export function calcPresentValue(cmp: number, quantity: number): number {
  return cmp * quantity;
}

/**
 * Calculates gain or loss.
 */
export function calcGainLoss(presentValue: number, investment: number): number {
  return presentValue - investment;
}

/**
 * Calculates gain/loss percentage.
 */
export function calcGainLossPercent(gainLoss: number, investment: number): number {
  if (investment === 0) return 0;
  return (gainLoss / investment) * 100;
}

/**
 * Determines if a value represents a gain (positive or zero).
 */
export function isGain(value: number): boolean {
  return value >= 0;
}

/**
 * Computes sector-level summary from an array of stocks.
 */
export function computeSectorSummary(
  sector: string,
  stocks: PortfolioStock[]
): SectorSummary {
  const totalInvestment = stocks.reduce((sum, s) => sum + s.investment, 0);
  const totalPresentValue = stocks.reduce((sum, s) => sum + s.presentValue, 0);
  const gainLoss = totalPresentValue - totalInvestment;
  const gainLossPercent = totalInvestment > 0 ? (gainLoss / totalInvestment) * 100 : 0;

  return {
    sector,
    totalInvestment,
    totalPresentValue,
    gainLoss,
    gainLossPercent,
    stockCount: stocks.length,
    stocks,
  };
}

/**
 * Groups stocks by sector.
 */
export function groupBySector(stocks: PortfolioStock[]): Map<string, PortfolioStock[]> {
  const map = new Map<string, PortfolioStock[]>();

  for (const stock of stocks) {
    const existing = map.get(stock.sector) || [];
    existing.push(stock);
    map.set(stock.sector, existing);
  }

  return map;
}

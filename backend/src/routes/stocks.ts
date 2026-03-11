import { Router, Request, Response, NextFunction } from 'express';
import { portfolioStore } from '../services/portfolioStore.js';
import { getStockFundamentals, getBatchFundamentals } from '../services/googleFinance.js';
import { cacheService } from '../services/cache.js';
import { PortfolioStock, SectorSummary, PortfolioSummary, ApiResponse } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/stocks/quote/:symbol
 * Fetch real-time quote for a single stock (via Google Finance)
 */
router.get('/quote/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;

    if (!symbol || typeof symbol !== 'string') {
      throw new AppError('Symbol parameter is required', 400, 'INVALID_SYMBOL');
    }

    // Use nseCode format — strip ".NS" suffix if present
    const nseCode = symbol.replace(/\.NS$/i, '');
    const fundamentals = await getStockFundamentals(nseCode);

    const quote = {
      symbol,
      cmp: fundamentals.cmp ?? 0,
      change: fundamentals.change ?? 0,
      changePercent: fundamentals.changePercent ?? 0,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      lastUpdated: fundamentals.lastUpdated,
    };

    const response: ApiResponse<typeof quote> = {
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stocks/fundamentals/:nseCode
 * Fetch P/E ratio and earnings from Google Finance
 */
router.get('/fundamentals/:nseCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nseCode } = req.params;

    if (!nseCode || typeof nseCode !== 'string') {
      throw new AppError('NSE code parameter is required', 400, 'INVALID_NSE_CODE');
    }

    const fundamentals = await getStockFundamentals(nseCode);
    const response: ApiResponse<typeof fundamentals> = {
      success: true,
      data: fundamentals,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stocks/portfolio
 * Fetch full portfolio data with live CMP, P/E, and calculated fields.
 * This is the main endpoint consumed by the dashboard.
 */
router.get('/portfolio', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const holdings = portfolioStore.getHoldings();
    const nseCodes = holdings.map((h) => h.nseCode);

    // Fetch all data from Google Finance (CMP + fundamentals in one scrape)
    const fundamentalsMap = await getBatchFundamentals(nseCodes);

    // Calculate total investment for portfolio weight calculation
    const totalInvestment = holdings.reduce(
      (sum, h) => sum + h.purchasePrice * h.quantity,
      0
    );

    // Build enriched portfolio stocks
    const portfolioStocks: PortfolioStock[] = holdings.map((holding) => {
      const fundamentals = fundamentalsMap.get(holding.nseCode);

      const cmp = fundamentals?.cmp ?? 0;
      const investment = holding.purchasePrice * holding.quantity;
      const presentValue = cmp * holding.quantity;
      const gainLoss = presentValue - investment;
      const gainLossPercent = investment > 0 ? (gainLoss / investment) * 100 : 0;
      const portfolioWeight = totalInvestment > 0 ? (investment / totalInvestment) * 100 : 0;

      return {
        ...holding,
        cmp,
        investment,
        presentValue,
        gainLoss,
        gainLossPercent,
        portfolioWeight,
        peRatio: fundamentals?.peRatio ?? null,
        latestEarnings: fundamentals?.latestEarnings ?? null,
        dayChange: fundamentals?.change ?? 0,
        dayChangePercent: fundamentals?.changePercent ?? 0,
      };
    });

    // Group by sector and compute summaries
    const sectorMap = new Map<string, PortfolioStock[]>();
    for (const stock of portfolioStocks) {
      const existing = sectorMap.get(stock.sector) || [];
      existing.push(stock);
      sectorMap.set(stock.sector, existing);
    }

    const sectors: SectorSummary[] = Array.from(sectorMap.entries()).map(
      ([sector, stocks]) => {
        const sectorInvestment = stocks.reduce((s, st) => s + st.investment, 0);
        const sectorPresentValue = stocks.reduce((s, st) => s + st.presentValue, 0);
        const sectorGainLoss = sectorPresentValue - sectorInvestment;

        return {
          sector,
          totalInvestment: sectorInvestment,
          totalPresentValue: sectorPresentValue,
          gainLoss: sectorGainLoss,
          gainLossPercent:
            sectorInvestment > 0 ? (sectorGainLoss / sectorInvestment) * 100 : 0,
          stockCount: stocks.length,
          stocks,
        };
      }
    );

    const totalPresentValue = portfolioStocks.reduce((s, st) => s + st.presentValue, 0);
    const totalGainLoss = totalPresentValue - totalInvestment;

    const portfolio: PortfolioSummary = {
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercent:
        totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0,
      sectors,
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<PortfolioSummary> = {
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stocks/holdings
 * Returns the current portfolio holdings data (no live prices)
 */
router.get('/holdings', (_req: Request, res: Response) => {
  const holdings = portfolioStore.getHoldings();
  const response: ApiResponse<typeof holdings> = {
    success: true,
    data: holdings,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

/**
 * GET /api/stocks/cache-stats
 * Returns cache statistics for monitoring
 */
router.get('/cache-stats', (_req: Request, res: Response) => {
  const stats = cacheService.getStats();
  const response: ApiResponse<typeof stats> = {
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export default router;

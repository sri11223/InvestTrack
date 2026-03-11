import { Router, Request, Response, NextFunction } from 'express';
import { PORTFOLIO_HOLDINGS } from '../data/portfolio.js';
import { getStockQuote, getBatchQuotes } from '../services/yahooFinance.js';
import { getStockFundamentals, getBatchFundamentals } from '../services/googleFinance.js';
import { cacheService } from '../services/cache.js';
import { PortfolioStock, SectorSummary, PortfolioSummary, ApiResponse } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/stocks/quote/:symbol
 * Fetch real-time quote for a single stock
 */
router.get('/quote/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;

    if (!symbol || typeof symbol !== 'string') {
      throw new AppError('Symbol parameter is required', 400, 'INVALID_SYMBOL');
    }

    const quote = await getStockQuote(symbol);
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
    const symbols = PORTFOLIO_HOLDINGS.map((h) => h.symbol);
    const nseCodes = PORTFOLIO_HOLDINGS.map((h) => h.nseCode);

    // Fetch quotes and fundamentals in parallel
    const [quotesMap, fundamentalsMap] = await Promise.all([
      getBatchQuotes(symbols),
      getBatchFundamentals(nseCodes),
    ]);

    // Calculate total investment for portfolio weight calculation
    const totalInvestment = PORTFOLIO_HOLDINGS.reduce(
      (sum, h) => sum + h.purchasePrice * h.quantity,
      0
    );

    // Build enriched portfolio stocks
    const portfolioStocks: PortfolioStock[] = PORTFOLIO_HOLDINGS.map((holding) => {
      const quote = quotesMap.get(holding.symbol);
      const fundamentals = fundamentalsMap.get(holding.nseCode);

      const cmp = quote?.cmp ?? 0;
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
        dayChange: quote?.change ?? 0,
        dayChangePercent: quote?.changePercent ?? 0,
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
 * Returns the static portfolio holdings data (no live prices)
 */
router.get('/holdings', (_req: Request, res: Response) => {
  const response: ApiResponse<typeof PORTFOLIO_HOLDINGS> = {
    success: true,
    data: PORTFOLIO_HOLDINGS,
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

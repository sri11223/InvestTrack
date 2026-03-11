import { Router, Request, Response, NextFunction } from 'express';
import { portfolioStore } from '../services/portfolioStore.js';
import { getStockFundamentals, getBatchFundamentals } from '../services/googleFinance.js';
import { getBatchQuotes, getHistoricalData } from '../services/yahooFinance.js';
import { cacheService } from '../services/cache.js';
import { PortfolioStock, SectorSummary, PortfolioSummary, ApiResponse, ChartDataResponse } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/stocks/quote/:symbol
 * Fetch real-time quote for a single stock (Yahoo Finance primary, Google fallback)
 */
router.get('/quote/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;

    if (!symbol || typeof symbol !== 'string') {
      throw new AppError('Symbol parameter is required', 400, 'INVALID_SYMBOL');
    }

    // Try Yahoo Finance first for CMP
    const nseCode = symbol.replace(/\.NS$/i, '');
    const yahooSymbol = symbol.endsWith('.NS') ? symbol : `${nseCode}.NS`;

    let quote;
    try {
      const yahooQuote = await (await import('../services/yahooFinance.js')).getStockQuote(yahooSymbol);
      quote = yahooQuote;
    } catch {
      // Fallback to Google Finance
      const fundamentals = await getStockFundamentals(nseCode);
      quote = {
        symbol,
        cmp: fundamentals.cmp ?? 0,
        change: fundamentals.change ?? 0,
        changePercent: fundamentals.changePercent ?? 0,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        lastUpdated: fundamentals.lastUpdated,
      };
    }

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
    const symbols = holdings.map((h) => h.symbol);

    // Fetch CMP from Yahoo Finance (primary source for real-time prices)
    // Fetch P/E and Earnings from Google Finance (fundamentals)
    const [quotesMap, fundamentalsMap] = await Promise.all([
      getBatchQuotes(symbols),
      getBatchFundamentals(nseCodes),
    ]);

    // Calculate total investment for portfolio weight calculation
    const totalInvestment = holdings.reduce(
      (sum, h) => sum + h.purchasePrice * h.quantity,
      0
    );

    // Build enriched portfolio stocks
    const portfolioStocks: PortfolioStock[] = holdings.map((holding) => {
      const yahooQuote = quotesMap.get(holding.symbol);
      const fundamentals = fundamentalsMap.get(holding.nseCode);

      // CMP: prefer Yahoo Finance, fallback to Google Finance
      const cmp = yahooQuote?.cmp ?? fundamentals?.cmp ?? 0;
      const dayChange = yahooQuote?.change ?? fundamentals?.change ?? 0;
      const dayChangePercent = yahooQuote?.changePercent ?? fundamentals?.changePercent ?? 0;

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
        dayChange,
        dayChangePercent,
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

/**
 * GET /api/stocks/chart/:symbol?period=1M
 * Fetch historical OHLCV data from Yahoo Finance for charting.
 * Supported periods: 1W, 1M, 3M, 6M, 1Y
 */
router.get('/chart/:symbol', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;
    const period = (req.query.period as string) || '1M';

    if (!symbol || typeof symbol !== 'string') {
      throw new AppError('Symbol parameter is required', 400, 'INVALID_SYMBOL');
    }

    const validPeriods = ['1W', '1M', '3M', '6M', '1Y'];
    if (!validPeriods.includes(period)) {
      throw new AppError(`Invalid period. Use one of: ${validPeriods.join(', ')}`, 400, 'INVALID_PERIOD');
    }

    const yahooSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;
    const data = await getHistoricalData(yahooSymbol, period);

    const chartResponse: ChartDataResponse = {
      symbol,
      period,
      data,
      lastUpdated: new Date().toISOString(),
    };

    const response: ApiResponse<ChartDataResponse> = {
      success: true,
      data: chartResponse,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

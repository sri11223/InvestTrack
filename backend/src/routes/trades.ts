import { Router, Request, Response, NextFunction } from 'express';
import { portfolioStore } from '../services/portfolioStore.js';
import { searchStocks, lookupStockPrice, getStockInfo } from '../services/stockSearch.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApiResponse, Trade, TradeCalculation, TradeRequest, StockSearchResult, WatchlistItem, StockHolding } from '../types/index.js';

const router = Router();

// ─── Search ─────────────────────────────────────────────────────────────────

/**
 * GET /api/trades/search?q=hdfc
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || '';
    if (query.length < 1) {
      throw new AppError('Query parameter "q" is required (min 1 char)', 400, 'INVALID_QUERY');
    }

    const results = searchStocks(query);

    // Optionally fetch live prices for first 5 results
    const withPrices: StockSearchResult[] = await Promise.all(
      results.slice(0, 10).map(async (r) => {
        const priceData = await lookupStockPrice(r.nseCode);
        return { ...r, cmp: priceData?.price ?? null };
      })
    );

    // Append remaining without prices
    const remainingResults = results.slice(10).map((r) => ({ ...r, cmp: null }));

    const response: ApiResponse<StockSearchResult[]> = {
      success: true,
      data: [...withPrices, ...remainingResults],
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ─── Holdings CRUD ──────────────────────────────────────────────────────────

/**
 * GET /api/trades/holdings
 */
router.get('/holdings', (_req: Request, res: Response) => {
  const response: ApiResponse<StockHolding[]> = {
    success: true,
    data: portfolioStore.getHoldings(),
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

/**
 * POST /api/trades/holdings
 * Add a custom holding directly (without going through buy)
 */
router.post('/holdings', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, symbol, nseCode, bseCode, sector, purchasePrice, quantity, purchaseDate } = req.body;

    if (!nseCode || !name || !purchasePrice || !quantity) {
      throw new AppError('nseCode, name, purchasePrice, and quantity are required', 400, 'INVALID_BODY');
    }

    const holding = portfolioStore.addHolding({
      name,
      symbol: symbol || `${nseCode}.NS`,
      nseCode,
      bseCode: bseCode || '',
      sector: sector || 'Other',
      purchasePrice: Number(purchasePrice),
      quantity: Number(quantity),
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    });

    const response: ApiResponse<StockHolding> = {
      success: true,
      data: holding,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/trades/holdings/:id
 */
router.put('/holdings/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = portfolioStore.updateHolding(req.params.id, req.body);
    if (!updated) {
      throw new AppError('Holding not found', 404, 'NOT_FOUND');
    }
    const response: ApiResponse<StockHolding> = {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/trades/holdings/:id
 */
router.delete('/holdings/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = portfolioStore.removeHolding(req.params.id);
    if (!deleted) {
      throw new AppError('Holding not found', 404, 'NOT_FOUND');
    }
    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ─── Execute Trade (BUY / SELL) ─────────────────────────────────────────────

/**
 * POST /api/trades/execute
 */
router.post('/execute', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol, nseCode, name, sector, bseCode, action, price, quantity, notes } = req.body as TradeRequest;

    if (!nseCode || !action || !price || !quantity) {
      throw new AppError('nseCode, action (BUY/SELL), price, and quantity are required', 400, 'INVALID_BODY');
    }
    if (action !== 'BUY' && action !== 'SELL') {
      throw new AppError('action must be BUY or SELL', 400, 'INVALID_ACTION');
    }
    if (price <= 0 || quantity <= 0) {
      throw new AppError('price and quantity must be positive', 400, 'INVALID_VALUES');
    }

    const stockInfo = getStockInfo(nseCode);
    const tradeReq: TradeRequest = {
      symbol: symbol || stockInfo?.symbol || `${nseCode}.NS`,
      nseCode,
      name: name || stockInfo?.name || nseCode,
      sector: sector || stockInfo?.sector || 'Other',
      bseCode: bseCode || '',
      action,
      price: Number(price),
      quantity: Number(quantity),
      notes,
    };

    const result = portfolioStore.executeTrade(tradeReq);

    const response: ApiResponse<{ trade: Trade; holding: StockHolding }> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trades/history
 */
router.get('/history', (_req: Request, res: Response) => {
  const response: ApiResponse<Trade[]> = {
    success: true,
    data: portfolioStore.getTrades(),
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// ─── P&L Calculator ─────────────────────────────────────────────────────────

/**
 * POST /api/trades/calculate
 * Calculate profit/loss for a hypothetical trade
 */
router.post('/calculate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { buyPrice, sellPrice, quantity } = req.body;

    if (!buyPrice || !sellPrice || !quantity) {
      throw new AppError('buyPrice, sellPrice, and quantity are required', 400, 'INVALID_BODY');
    }

    const bp = Number(buyPrice);
    const sp = Number(sellPrice);
    const qty = Number(quantity);

    if (bp <= 0 || sp <= 0 || qty <= 0) {
      throw new AppError('All values must be positive', 400, 'INVALID_VALUES');
    }

    const investment = bp * qty;
    const returns = sp * qty;
    const profit = returns - investment;
    const profitPercent = investment > 0 ? (profit / investment) * 100 : 0;
    const breakEvenPrice = bp;

    const calculation: TradeCalculation = {
      buyPrice: bp,
      sellPrice: sp,
      quantity: qty,
      investment,
      returns,
      profit,
      profitPercent,
      breakEvenPrice,
    };

    const response: ApiResponse<TradeCalculation> = {
      success: true,
      data: calculation,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// ─── Watchlist ──────────────────────────────────────────────────────────────

/**
 * GET /api/trades/watchlist
 */
router.get('/watchlist', (_req: Request, res: Response) => {
  const response: ApiResponse<WatchlistItem[]> = {
    success: true,
    data: portfolioStore.getWatchlist(),
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

/**
 * POST /api/trades/watchlist
 */
router.post('/watchlist', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nseCode, symbol, name, sector, targetPrice, notes } = req.body;

    if (!nseCode || !name) {
      throw new AppError('nseCode and name are required', 400, 'INVALID_BODY');
    }

    const item = portfolioStore.addToWatchlist({
      nseCode,
      symbol: symbol || `${nseCode}.NS`,
      name,
      sector: sector || 'Other',
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      notes,
    });

    const response: ApiResponse<WatchlistItem> = {
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/trades/watchlist/:id
 */
router.delete('/watchlist/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = portfolioStore.removeFromWatchlist(req.params.id);
    if (!deleted) {
      throw new AppError('Watchlist item not found', 404, 'NOT_FOUND');
    }
    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

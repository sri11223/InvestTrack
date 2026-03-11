import { Router, Request, Response } from 'express';
import stocksRouter from './stocks.js';
import tradesRouter from './trades.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount stock routes
router.use('/stocks', stocksRouter);

// Mount trade routes (buy/sell, search, watchlist, calculator)
router.use('/trades', tradesRouter);

export default router;

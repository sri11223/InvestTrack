import YahooFinance from 'yahoo-finance2';
import { StockQuote } from '../types/index.js';
import { cacheService } from './cache.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

// Create an instance of YahooFinance
const yf = new YahooFinance();

/**
 * Fetches the current market price and quote data for a single stock symbol.
 * Uses yahoo-finance2 library (unofficial Yahoo Finance API wrapper).
 *
 * Caching strategy: quotes cached for a short TTL (default 30s) since
 * CMP data needs to be relatively fresh for the dashboard.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const cacheKey = `quote:${symbol}`;
  const cached = cacheService.get<StockQuote>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const result = await yf.quote(symbol);

    if (!result || !result.regularMarketPrice) {
      throw new AppError(
        `No quote data available for symbol: ${symbol}`,
        404,
        'QUOTE_NOT_FOUND'
      );
    }

    const quote: StockQuote = {
      symbol,
      cmp: result.regularMarketPrice,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      dayHigh: result.regularMarketDayHigh ?? 0,
      dayLow: result.regularMarketDayLow ?? 0,
      volume: result.regularMarketVolume ?? 0,
      lastUpdated: new Date().toISOString(),
    };

    cacheService.set(cacheKey, quote, config.cache.quoteTTL);
    return quote;
  } catch (error) {
    if (error instanceof AppError) throw error;

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to fetch quote for ${symbol}`, { error: message });
    throw new AppError(
      `Failed to fetch stock quote for ${symbol}: ${message}`,
      502,
      'YAHOO_API_ERROR'
    );
  }
}

/**
 * Fetches quotes for multiple symbols in parallel with concurrency control.
 * Uses Promise.allSettled to ensure partial failures don't block other results.
 */
export async function getBatchQuotes(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const BATCH_SIZE = 5; // Concurrent request limit to avoid rate limiting
  const results = new Map<string, StockQuote>();

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((symbol) => getStockQuote(symbol))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.set(batch[index], result.value);
      } else {
        logger.warn(`Failed to fetch quote for ${batch[index]}`, {
          reason: result.reason?.message || 'Unknown',
        });
      }
    });

    // Small delay between batches to be respectful to the API
    if (i + BATCH_SIZE < symbols.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

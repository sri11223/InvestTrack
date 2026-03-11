import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import { StockQuote, CandlestickData } from '../types/index.js';
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

/**
 * Fetches historical OHLCV data using Yahoo Finance's public chart web API.
 * The yahoo-finance2 library (v2) doesn't support historical/chart,
 * so we call the Yahoo Finance chart endpoint directly via HTTP.
 * Cached for 15 minutes.
 */
export async function getHistoricalData(
  symbol: string,
  period: string
): Promise<CandlestickData[]> {
  const cacheKey = `chart:${symbol}:${period}`;
  const cached = cacheService.get<CandlestickData[]>(cacheKey);
  if (cached) return cached;

  const rangeMap: Record<string, string> = {
    '1W': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y',
  };
  const intervalMap: Record<string, string> = {
    '1W': '1d', '1M': '1d', '3M': '1d', '6M': '1wk', '1Y': '1wk',
  };

  const range = rangeMap[period] || '1mo';
  const interval = intervalMap[period] || '1d';

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const response = await axios.get(url, {
      params: { range, interval, includePrePost: false },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const chartResult = response.data?.chart?.result?.[0];
    if (!chartResult || !chartResult.timestamp) {
      throw new AppError(`No historical data for ${symbol}`, 404, 'CHART_NOT_FOUND');
    }

    const timestamps: number[] = chartResult.timestamp;
    const quotes = chartResult.indicators?.quote?.[0];
    if (!quotes) {
      throw new AppError(`No quote data in chart for ${symbol}`, 404, 'CHART_NO_QUOTES');
    }

    const data: CandlestickData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quotes.close?.[i];
      if (close == null) continue;

      data.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open: parseFloat((quotes.open?.[i] ?? close).toFixed(2)),
        high: parseFloat((quotes.high?.[i] ?? close).toFixed(2)),
        low: parseFloat((quotes.low?.[i] ?? close).toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: quotes.volume?.[i] ?? 0,
      });
    }

    // Cache for 15 minutes
    cacheService.set(cacheKey, data, 900);
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to fetch historical data for ${symbol}`, { error: message });
    throw new AppError(
      `Failed to fetch chart data for ${symbol}: ${message}`,
      502,
      'YAHOO_CHART_ERROR'
    );
  }
}

import axios from 'axios';
import * as cheerio from 'cheerio';
import { StockFundamentals } from '../types/index.js';
import { cacheService } from './cache.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const GOOGLE_FINANCE_BASE = 'https://www.google.com/finance/quote';

/**
 * Scrapes Google Finance page for fundamental data (P/E Ratio, latest earnings).
 * 
 * Strategy: Google Finance doesn't provide a public API, so we scrape the
 * rendered HTML page. This approach is fragile and may break if Google
 * changes their page structure. We use longer cache TTLs (5min default)
 * for fundamentals since they change less frequently.
 * 
 * Symbol format: "HDFCBANK:NSE" for Google Finance
 */
export async function getStockFundamentals(
  nseCode: string
): Promise<StockFundamentals> {
  const cacheKey = `fundamentals:${nseCode}`;
  const cached = cacheService.get<StockFundamentals>(cacheKey);

  if (cached) {
    return cached;
  }

  try {
    const url = `${GOOGLE_FINANCE_BASE}/${encodeURIComponent(nseCode)}:NSE`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const fundamentals = parseGoogleFinancePage($, nseCode);

    cacheService.set(cacheKey, fundamentals, config.cache.fundamentalsTTL);
    return fundamentals;
  } catch (error) {
    if (error instanceof AppError) throw error;

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to scrape Google Finance for ${nseCode}`, { error: message });

    // Return partial data instead of failing completely
    const fallback: StockFundamentals = {
      symbol: nseCode,
      cmp: null,
      change: null,
      changePercent: null,
      peRatio: null,
      latestEarnings: null,
      marketCap: null,
      weekHigh52: null,
      weekLow52: null,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the fallback for a shorter period
    cacheService.set(cacheKey, fallback, 60);
    return fallback;
  }
}

/**
 * Parses the Google Finance HTML page to extract fundamental data.
 * Looks for specific data fields in the page's structured table.
 */
function parseGoogleFinancePage(
  $: cheerio.CheerioAPI,
  symbol: string
): StockFundamentals {
  let cmp: number | null = null;
  let change: number | null = null;
  let changePercent: number | null = null;
  let peRatio: number | null = null;
  let latestEarnings: string | null = null;
  let marketCap: string | null = null;
  let weekHigh52: number | null = null;
  let weekLow52: number | null = null;

  // ─── Extract CMP (Current Market Price) ─────────────────────
  // Most reliable: data-last-price attribute
  const lastPriceAttr = $('[data-last-price]').first().attr('data-last-price');
  if (lastPriceAttr) {
    const parsed = parseFloat(lastPriceAttr);
    if (!isNaN(parsed)) cmp = parsed;
  }

  // Fallback: the main price display element
  if (cmp === null) {
    const priceEl = $('div.YMlKec.fxKbKc').first();
    if (priceEl.length) {
      const priceText = priceEl.text().trim().replace(/[₹,\s]/g, '');
      const parsed = parseFloat(priceText);
      if (!isNaN(parsed)) cmp = parsed;
    }
  }

  // ─── Extract Price Change Percent ──────────────────────────
  // Google Finance shows change% in span.JwB6zf (e.g. "-0.98%")
  const changeElements = $('span.JwB6zf, div.JwB6zf');
  if (changeElements.length) {
    const changeText = changeElements.first().text().trim();
    const cleanPct = changeText.replace(/[()%,\s₹]/g, '').replace(/[−–—]/g, '-');
    const parsedPct = parseFloat(cleanPct);
    if (!isNaN(parsedPct)) {
      changePercent = parsedPct;
      // Calculate absolute change from CMP and percentage
      if (cmp !== null && cmp > 0) {
        change = (cmp * changePercent) / (100 + changePercent);
      }
    }
  }

  // Google Finance displays fundamentals in a description list / table format
  // The labels and values are in adjacent elements
  const dataRows = $('[data-attrid], .gyFHrc, .P6K39c');

  // Method 1: Try structured data attributes
  $('div.gyFHrc').each((_, element) => {
    const label = $(element).find('.mfs7Fc').text().trim().toLowerCase();
    const value = $(element).find('.P6K39c').text().trim();

    if (label.includes('p/e ratio') || label.includes('pe ratio')) {
      const parsed = parseFloat(value.replace(/,/g, ''));
      if (!isNaN(parsed)) peRatio = parsed;
    }

    if (label.includes('earnings') || label.includes('eps')) {
      latestEarnings = value || null;
    }

    if (label.includes('market cap')) {
      marketCap = value || null;
    }

    if (label.includes('52-wk high') || label.includes('52 week high')) {
      const parsed = parseFloat(value.replace(/[₹,]/g, ''));
      if (!isNaN(parsed)) weekHigh52 = parsed;
    }

    if (label.includes('52-wk low') || label.includes('52 week low')) {
      const parsed = parseFloat(value.replace(/[₹,]/g, ''));
      if (!isNaN(parsed)) weekLow52 = parsed;
    }
  });

  // Method 2: Fallback - scan all text nodes for common patterns
  if (peRatio === null) {
    const pageText = $.text();
    const peMatch = pageText.match(/P\/E\s+ratio\s*[:\s]*(\d+\.?\d*)/i);
    if (peMatch) {
      peRatio = parseFloat(peMatch[1]);
    }
  }

  logger.debug(`Parsed fundamentals for ${symbol}`, {
    cmp,
    change,
    changePercent,
    peRatio,
    latestEarnings,
    marketCap,
  });

  return {
    symbol,
    cmp,
    change,
    changePercent,
    peRatio,
    latestEarnings,
    marketCap,
    weekHigh52,
    weekLow52,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetches fundamentals for multiple stocks with concurrency control.
 */
export async function getBatchFundamentals(
  nseCodes: string[]
): Promise<Map<string, StockFundamentals>> {
  const BATCH_SIZE = 3; // Lower concurrency since we're scraping
  const results = new Map<string, StockFundamentals>();

  for (let i = 0; i < nseCodes.length; i += BATCH_SIZE) {
    const batch = nseCodes.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((code) => getStockFundamentals(code))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.set(batch[index], result.value);
      } else {
        logger.warn(`Failed to fetch fundamentals for ${batch[index]}`, {
          reason: result.reason?.message || 'Unknown',
        });
      }
    });

    // Longer delay for scraping to avoid being blocked
    if (i + BATCH_SIZE < nseCodes.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

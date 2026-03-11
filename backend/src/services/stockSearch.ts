import axios from 'axios';
import * as cheerio from 'cheerio';
import { StockSearchResult } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { cacheService } from './cache.js';

// Curated list of popular NSE stocks for fast local search
const NSE_STOCKS: StockSearchResult[] = [
  { symbol: 'HDFCBANK.NS', nseCode: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'ICICIBANK.NS', nseCode: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'SBIN.NS', nseCode: 'SBIN', name: 'State Bank of India', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'BAJFINANCE.NS', nseCode: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'KOTAKBANK.NS', nseCode: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'AXISBANK.NS', nseCode: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'INDUSINDBK.NS', nseCode: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'HDFCLIFE.NS', nseCode: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'SBILIFE.NS', nseCode: 'SBILIFE', name: 'SBI Life Insurance', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'BAJAJFINSV.NS', nseCode: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'TCS.NS', nseCode: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'INFY.NS', nseCode: 'INFY', name: 'Infosys Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'WIPRO.NS', nseCode: 'WIPRO', name: 'Wipro Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'HCLTECH.NS', nseCode: 'HCLTECH', name: 'HCL Technologies', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'TECHM.NS', nseCode: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'LTIM.NS', nseCode: 'LTIM', name: 'LTIMindtree Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'PERSISTENT.NS', nseCode: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'COFORGE.NS', nseCode: 'COFORGE', name: 'Coforge Ltd', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'SUNPHARMA.NS', nseCode: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Healthcare', exchange: 'NSE' },
  { symbol: 'DRREDDY.NS', nseCode: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Healthcare', exchange: 'NSE' },
  { symbol: 'CIPLA.NS', nseCode: 'CIPLA', name: 'Cipla Ltd', sector: 'Healthcare', exchange: 'NSE' },
  { symbol: 'DIVISLAB.NS', nseCode: 'DIVISLAB', name: "Divi's Laboratories", sector: 'Healthcare', exchange: 'NSE' },
  { symbol: 'APOLLOHOSP.NS', nseCode: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', sector: 'Healthcare', exchange: 'NSE' },
  { symbol: 'ITC.NS', nseCode: 'ITC', name: 'ITC Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'HINDUNILVR.NS', nseCode: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'ASIANPAINT.NS', nseCode: 'ASIANPAINT', name: 'Asian Paints Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'NESTLEIND.NS', nseCode: 'NESTLEIND', name: 'Nestle India Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'BRITANNIA.NS', nseCode: 'BRITANNIA', name: 'Britannia Industries', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'DABUR.NS', nseCode: 'DABUR', name: 'Dabur India Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'MARICO.NS', nseCode: 'MARICO', name: 'Marico Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'TITAN.NS', nseCode: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'RELIANCE.NS', nseCode: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'ONGC.NS', nseCode: 'ONGC', name: 'ONGC Ltd', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'BPCL.NS', nseCode: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'IOC.NS', nseCode: 'IOC', name: 'Indian Oil Corporation', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'NTPC.NS', nseCode: 'NTPC', name: 'NTPC Ltd', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'POWERGRID.NS', nseCode: 'POWERGRID', name: 'Power Grid Corp', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'ADANIENT.NS', nseCode: 'ADANIENT', name: 'Adani Enterprises', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'ADANIGREEN.NS', nseCode: 'ADANIGREEN', name: 'Adani Green Energy', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'TATAMOTORS.NS', nseCode: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'MARUTI.NS', nseCode: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'M&M.NS', nseCode: 'M&M', name: 'Mahindra & Mahindra', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'BAJAJ-AUTO.NS', nseCode: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'EICHERMOT.NS', nseCode: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'HEROMOTOCO.NS', nseCode: 'HEROMOTOCO', name: 'Hero MotoCorp', sector: 'Automobile', exchange: 'NSE' },
  { symbol: 'TATASTEEL.NS', nseCode: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', exchange: 'NSE' },
  { symbol: 'JSWSTEEL.NS', nseCode: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals', exchange: 'NSE' },
  { symbol: 'HINDALCO.NS', nseCode: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', exchange: 'NSE' },
  { symbol: 'COALINDIA.NS', nseCode: 'COALINDIA', name: 'Coal India Ltd', sector: 'Metals', exchange: 'NSE' },
  { symbol: 'LT.NS', nseCode: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure', exchange: 'NSE' },
  { symbol: 'ULTRACEMCO.NS', nseCode: 'ULTRACEMCO', name: 'UltraTech Cement', sector: 'Infrastructure', exchange: 'NSE' },
  { symbol: 'GRASIM.NS', nseCode: 'GRASIM', name: 'Grasim Industries', sector: 'Infrastructure', exchange: 'NSE' },
  { symbol: 'ADANIPORTS.NS', nseCode: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure', exchange: 'NSE' },
  { symbol: 'BHARTIARTL.NS', nseCode: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'NSE' },
  { symbol: 'JIOFINANCE.NS', nseCode: 'JIOFINANCE', name: 'Jio Financial Services', sector: 'Financials', exchange: 'NSE' },
  { symbol: 'ZOMATO.NS', nseCode: 'ZOMATO', name: 'Zomato Ltd', sector: 'Consumer Services', exchange: 'NSE' },
  { symbol: 'PAYTM.NS', nseCode: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Technology', exchange: 'NSE' },
  { symbol: 'NYKAA.NS', nseCode: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', sector: 'Consumer Services', exchange: 'NSE' },
  { symbol: 'DMART.NS', nseCode: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Consumer Goods', exchange: 'NSE' },
  { symbol: 'TATAPOWER.NS', nseCode: 'TATAPOWER', name: 'Tata Power Company', sector: 'Energy', exchange: 'NSE' },
  { symbol: 'IRCTC.NS', nseCode: 'IRCTC', name: 'Indian Railway Catering', sector: 'Consumer Services', exchange: 'NSE' },
  { symbol: 'HAL.NS', nseCode: 'HAL', name: 'Hindustan Aeronautics', sector: 'Defence', exchange: 'NSE' },
  { symbol: 'BEL.NS', nseCode: 'BEL', name: 'Bharat Electronics', sector: 'Defence', exchange: 'NSE' },
];

export function searchStocks(query: string): StockSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return NSE_STOCKS.filter(
    (s) =>
      s.nseCode.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
  ).slice(0, 20);
}

export async function lookupStockPrice(nseCode: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  const cacheKey = `lookup_${nseCode}`;
  const cached = cacheService.get<{ price: number; change: number; changePercent: number }>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.google.com/finance/quote/${encodeURIComponent(nseCode)}:NSE`;
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000,
    });
    const $ = cheerio.load(html);

    const priceEl = $('[data-last-price]').first();
    const price = parseFloat(priceEl.attr('data-last-price') || '0');
    const changeText = $('span.JwB6zf').first().text().trim();
    const changePercent = parseFloat(changeText.replace('%', '')) || 0;
    const change = price * (changePercent / 100);

    const result = { price, change, changePercent };
    if (price > 0) {
      cacheService.set(cacheKey, result, 30);
    }
    return price > 0 ? result : null;
  } catch (err) {
    logger.error(`Failed to lookup price for ${nseCode}`, { error: (err as Error).message });
    return null;
  }
}

export function getStockInfo(nseCode: string): StockSearchResult | undefined {
  return NSE_STOCKS.find((s) => s.nseCode === nseCode);
}

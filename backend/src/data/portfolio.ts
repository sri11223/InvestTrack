import { StockHolding } from '../types/index.js';

/**
 * Portfolio holdings master data.
 * This represents the user's portfolio — in a real production app,
 * this would come from a database. For this dashboard, it's static configuration.
 */
export const PORTFOLIO_HOLDINGS: StockHolding[] = [
  // ─── Financials ─────────────────────────────────
  {
    name: 'HDFC Bank Ltd',
    symbol: 'HDFCBANK.NS',
    nseCode: 'HDFCBANK',
    bseCode: '500180',
    sector: 'Financials',
    purchasePrice: 1550,
    quantity: 50,
  },
  {
    name: 'ICICI Bank Ltd',
    symbol: 'ICICIBANK.NS',
    nseCode: 'ICICIBANK',
    bseCode: '532174',
    sector: 'Financials',
    purchasePrice: 920,
    quantity: 80,
  },
  {
    name: 'State Bank of India',
    symbol: 'SBIN.NS',
    nseCode: 'SBIN',
    bseCode: '500112',
    sector: 'Financials',
    purchasePrice: 580,
    quantity: 100,
  },
  {
    name: 'Bajaj Finance Ltd',
    symbol: 'BAJFINANCE.NS',
    nseCode: 'BAJFINANCE',
    bseCode: '500034',
    sector: 'Financials',
    purchasePrice: 6800,
    quantity: 10,
  },

  // ─── Technology ─────────────────────────────────
  {
    name: 'Tata Consultancy Services',
    symbol: 'TCS.NS',
    nseCode: 'TCS',
    bseCode: '532540',
    sector: 'Technology',
    purchasePrice: 3400,
    quantity: 30,
  },
  {
    name: 'Infosys Ltd',
    symbol: 'INFY.NS',
    nseCode: 'INFY',
    bseCode: '500209',
    sector: 'Technology',
    purchasePrice: 1450,
    quantity: 60,
  },
  {
    name: 'Wipro Ltd',
    symbol: 'WIPRO.NS',
    nseCode: 'WIPRO',
    bseCode: '507685',
    sector: 'Technology',
    purchasePrice: 420,
    quantity: 100,
  },
  {
    name: 'HCL Technologies',
    symbol: 'HCLTECH.NS',
    nseCode: 'HCLTECH',
    bseCode: '532281',
    sector: 'Technology',
    purchasePrice: 1180,
    quantity: 40,
  },

  // ─── Healthcare ─────────────────────────────────
  {
    name: 'Sun Pharmaceutical',
    symbol: 'SUNPHARMA.NS',
    nseCode: 'SUNPHARMA',
    bseCode: '524715',
    sector: 'Healthcare',
    purchasePrice: 1050,
    quantity: 45,
  },
  {
    name: "Dr. Reddy's Laboratories",
    symbol: 'DRREDDY.NS',
    nseCode: 'DRREDDY',
    bseCode: '500124',
    sector: 'Healthcare',
    purchasePrice: 5200,
    quantity: 12,
  },

  // ─── Consumer Goods ─────────────────────────────
  {
    name: 'ITC Ltd',
    symbol: 'ITC.NS',
    nseCode: 'ITC',
    bseCode: '500875',
    sector: 'Consumer Goods',
    purchasePrice: 340,
    quantity: 150,
  },
  {
    name: 'Hindustan Unilever',
    symbol: 'HINDUNILVR.NS',
    nseCode: 'HINDUNILVR',
    bseCode: '500696',
    sector: 'Consumer Goods',
    purchasePrice: 2500,
    quantity: 25,
  },
  {
    name: 'Asian Paints Ltd',
    symbol: 'ASIANPAINT.NS',
    nseCode: 'ASIANPAINT',
    bseCode: '500820',
    sector: 'Consumer Goods',
    purchasePrice: 3100,
    quantity: 20,
  },

  // ─── Energy ─────────────────────────────────────
  {
    name: 'Reliance Industries',
    symbol: 'RELIANCE.NS',
    nseCode: 'RELIANCE',
    bseCode: '500325',
    sector: 'Energy',
    purchasePrice: 2400,
    quantity: 35,
  },
  {
    name: 'ONGC Ltd',
    symbol: 'ONGC.NS',
    nseCode: 'ONGC',
    bseCode: '500312',
    sector: 'Energy',
    purchasePrice: 175,
    quantity: 200,
  },

  // ─── Automobile ─────────────────────────────────
  {
    name: 'Tata Motors Ltd',
    symbol: 'TATAMOTORS.NS',
    nseCode: 'TATAMOTORS',
    bseCode: '500570',
    sector: 'Automobile',
    purchasePrice: 620,
    quantity: 60,
  },
  {
    name: 'Maruti Suzuki India',
    symbol: 'MARUTI.NS',
    nseCode: 'MARUTI',
    bseCode: '532500',
    sector: 'Automobile',
    purchasePrice: 9800,
    quantity: 8,
  },
];

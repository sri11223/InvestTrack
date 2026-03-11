import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { StockHolding, Trade, WatchlistItem, TradeRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const HOLDINGS_FILE = path.join(DATA_DIR, 'holdings.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const WATCHLIST_FILE = path.join(DATA_DIR, 'watchlist.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    logger.error(`Failed to read ${filePath}`, { error: (err as Error).message });
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(): string {
  return crypto.randomUUID();
}

// ─── Default Holdings (seeded on first run) ─────────────────────────────────

const DEFAULT_HOLDINGS: StockHolding[] = [
  { id: '', name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', nseCode: 'HDFCBANK', bseCode: '500180', sector: 'Financials', purchasePrice: 1550, quantity: 50, purchaseDate: '2024-01-15' },
  { id: '', name: 'ICICI Bank Ltd', symbol: 'ICICIBANK.NS', nseCode: 'ICICIBANK', bseCode: '532174', sector: 'Financials', purchasePrice: 920, quantity: 80, purchaseDate: '2024-02-10' },
  { id: '', name: 'State Bank of India', symbol: 'SBIN.NS', nseCode: 'SBIN', bseCode: '500112', sector: 'Financials', purchasePrice: 580, quantity: 100, purchaseDate: '2024-03-05' },
  { id: '', name: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE.NS', nseCode: 'BAJFINANCE', bseCode: '500034', sector: 'Financials', purchasePrice: 6800, quantity: 10, purchaseDate: '2024-01-20' },
  { id: '', name: 'Tata Consultancy Services', symbol: 'TCS.NS', nseCode: 'TCS', bseCode: '532540', sector: 'Technology', purchasePrice: 3400, quantity: 30, purchaseDate: '2024-04-12' },
  { id: '', name: 'Infosys Ltd', symbol: 'INFY.NS', nseCode: 'INFY', bseCode: '500209', sector: 'Technology', purchasePrice: 1450, quantity: 60, purchaseDate: '2024-02-28' },
  { id: '', name: 'Wipro Ltd', symbol: 'WIPRO.NS', nseCode: 'WIPRO', bseCode: '507685', sector: 'Technology', purchasePrice: 420, quantity: 100, purchaseDate: '2024-05-15' },
  { id: '', name: 'HCL Technologies', symbol: 'HCLTECH.NS', nseCode: 'HCLTECH', bseCode: '532281', sector: 'Technology', purchasePrice: 1180, quantity: 40, purchaseDate: '2024-03-22' },
  { id: '', name: 'Sun Pharmaceutical', symbol: 'SUNPHARMA.NS', nseCode: 'SUNPHARMA', bseCode: '524715', sector: 'Healthcare', purchasePrice: 1050, quantity: 45, purchaseDate: '2024-06-10' },
  { id: '', name: "Dr. Reddy's Laboratories", symbol: 'DRREDDY.NS', nseCode: 'DRREDDY', bseCode: '500124', sector: 'Healthcare', purchasePrice: 5200, quantity: 12, purchaseDate: '2024-04-18' },
  { id: '', name: 'ITC Ltd', symbol: 'ITC.NS', nseCode: 'ITC', bseCode: '500875', sector: 'Consumer Goods', purchasePrice: 340, quantity: 150, purchaseDate: '2024-01-08' },
  { id: '', name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NS', nseCode: 'HINDUNILVR', bseCode: '500696', sector: 'Consumer Goods', purchasePrice: 2500, quantity: 25, purchaseDate: '2024-07-05' },
  { id: '', name: 'Asian Paints Ltd', symbol: 'ASIANPAINT.NS', nseCode: 'ASIANPAINT', bseCode: '500820', sector: 'Consumer Goods', purchasePrice: 3100, quantity: 20, purchaseDate: '2024-05-25' },
  { id: '', name: 'Reliance Industries', symbol: 'RELIANCE.NS', nseCode: 'RELIANCE', bseCode: '500325', sector: 'Energy', purchasePrice: 2400, quantity: 35, purchaseDate: '2024-02-14' },
  { id: '', name: 'ONGC Ltd', symbol: 'ONGC.NS', nseCode: 'ONGC', bseCode: '500312', sector: 'Energy', purchasePrice: 175, quantity: 200, purchaseDate: '2024-08-01' },
  { id: '', name: 'Tata Motors Ltd', symbol: 'TATAMOTORS.NS', nseCode: 'TATAMOTORS', bseCode: '500570', sector: 'Automobile', purchasePrice: 620, quantity: 60, purchaseDate: '2024-06-20' },
  { id: '', name: 'Maruti Suzuki India', symbol: 'MARUTI.NS', nseCode: 'MARUTI', bseCode: '532500', sector: 'Automobile', purchasePrice: 9800, quantity: 8, purchaseDate: '2024-03-10' },
].map((h) => ({ ...h, id: generateId() }));

// ─── Holdings Store ─────────────────────────────────────────────────────────

class PortfolioStore {
  private holdings: StockHolding[];
  private trades: Trade[];
  private watchlist: WatchlistItem[];

  constructor() {
    ensureDataDir();
    this.holdings = readJson<StockHolding[]>(HOLDINGS_FILE, []);
    this.trades = readJson<Trade[]>(TRADES_FILE, []);
    this.watchlist = readJson<WatchlistItem[]>(WATCHLIST_FILE, []);

    // Seed default holdings on first run
    if (this.holdings.length === 0) {
      this.holdings = DEFAULT_HOLDINGS;
      this.saveHoldings();
      logger.info('Seeded default portfolio holdings');
    }
  }

  // ── Holdings ──────────────────────────────────────────────

  getHoldings(): StockHolding[] {
    return [...this.holdings];
  }

  getHoldingById(id: string): StockHolding | undefined {
    return this.holdings.find((h) => h.id === id);
  }

  addHolding(holding: Omit<StockHolding, 'id'>): StockHolding {
    const newHolding: StockHolding = { ...holding, id: generateId() };
    this.holdings.push(newHolding);
    this.saveHoldings();
    return newHolding;
  }

  updateHolding(id: string, updates: Partial<StockHolding>): StockHolding | null {
    const index = this.holdings.findIndex((h) => h.id === id);
    if (index === -1) return null;
    this.holdings[index] = { ...this.holdings[index], ...updates, id };
    this.saveHoldings();
    return this.holdings[index];
  }

  removeHolding(id: string): boolean {
    const index = this.holdings.findIndex((h) => h.id === id);
    if (index === -1) return false;
    this.holdings.splice(index, 1);
    this.saveHoldings();
    return true;
  }

  // ── Trades ────────────────────────────────────────────────

  getTrades(): Trade[] {
    return [...this.trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  executeTrade(req: TradeRequest): { trade: Trade; holding: StockHolding } {
    const trade: Trade = {
      id: generateId(),
      holdingId: '',
      symbol: req.symbol,
      nseCode: req.nseCode,
      name: req.name,
      action: req.action,
      price: req.price,
      quantity: req.quantity,
      totalValue: req.price * req.quantity,
      date: new Date().toISOString(),
      notes: req.notes,
    };

    if (req.action === 'BUY') {
      // Check if we already have this stock — average up/down
      const existing = this.holdings.find((h) => h.nseCode === req.nseCode);
      if (existing) {
        // Calculate new average price
        const totalOldValue = existing.purchasePrice * existing.quantity;
        const totalNewValue = req.price * req.quantity;
        const totalQty = existing.quantity + req.quantity;
        existing.purchasePrice = (totalOldValue + totalNewValue) / totalQty;
        existing.quantity = totalQty;
        trade.holdingId = existing.id;
        this.saveHoldings();
      } else {
        // New holding
        const newHolding = this.addHolding({
          name: req.name,
          symbol: req.symbol,
          nseCode: req.nseCode,
          bseCode: req.bseCode,
          sector: req.sector,
          purchasePrice: req.price,
          quantity: req.quantity,
          purchaseDate: new Date().toISOString().split('T')[0],
        });
        trade.holdingId = newHolding.id;
      }
    } else {
      // SELL
      const existing = this.holdings.find((h) => h.nseCode === req.nseCode);
      if (!existing) {
        throw new Error(`Cannot sell ${req.nseCode}: no holding found`);
      }
      if (existing.quantity < req.quantity) {
        throw new Error(`Cannot sell ${req.quantity} shares of ${req.nseCode}: only ${existing.quantity} held`);
      }
      trade.holdingId = existing.id;
      existing.quantity -= req.quantity;

      if (existing.quantity === 0) {
        this.removeHolding(existing.id);
      } else {
        this.saveHoldings();
      }
    }

    this.trades.push(trade);
    this.saveTrades();

    const holding = this.holdings.find((h) => h.nseCode === req.nseCode) || {
      id: trade.holdingId,
      name: req.name,
      symbol: req.symbol,
      nseCode: req.nseCode,
      bseCode: req.bseCode,
      sector: req.sector,
      purchasePrice: req.price,
      quantity: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    };

    return { trade, holding };
  }

  // ── Watchlist ─────────────────────────────────────────────

  getWatchlist(): WatchlistItem[] {
    return [...this.watchlist];
  }

  addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'>): WatchlistItem {
    const exists = this.watchlist.find((w) => w.nseCode === item.nseCode);
    if (exists) return exists;

    const newItem: WatchlistItem = {
      ...item,
      id: generateId(),
      addedAt: new Date().toISOString(),
    };
    this.watchlist.push(newItem);
    this.saveWatchlist();
    return newItem;
  }

  removeFromWatchlist(id: string): boolean {
    const index = this.watchlist.findIndex((w) => w.id === id);
    if (index === -1) return false;
    this.watchlist.splice(index, 1);
    this.saveWatchlist();
    return true;
  }

  updateWatchlistItem(id: string, updates: Partial<WatchlistItem>): WatchlistItem | null {
    const index = this.watchlist.findIndex((w) => w.id === id);
    if (index === -1) return null;
    this.watchlist[index] = { ...this.watchlist[index], ...updates, id };
    this.saveWatchlist();
    return this.watchlist[index];
  }

  // ── Persistence ───────────────────────────────────────────

  private saveHoldings(): void {
    writeJson(HOLDINGS_FILE, this.holdings);
  }

  private saveTrades(): void {
    writeJson(TRADES_FILE, this.trades);
  }

  private saveWatchlist(): void {
    writeJson(WATCHLIST_FILE, this.watchlist);
  }
}

// Singleton
export const portfolioStore = new PortfolioStore();

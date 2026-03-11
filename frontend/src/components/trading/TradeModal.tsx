'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { StockSearchResult, TradeAction } from '@/types';
import { executeTrade } from '@/services/stockService';
import { formatCurrency } from '@/utils/formatters';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockSearchResult | null;
  defaultAction: TradeAction;
  currentHolding?: { quantity: number; purchasePrice: number };
  onTradeComplete: () => void;
}

export function TradeModal({ isOpen, onClose, stock, defaultAction, currentHolding, onTradeComplete }: TradeModalProps) {
  const [action, setAction] = useState<TradeAction>(defaultAction);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && stock) {
      setAction(defaultAction);
      setPrice(stock.cmp ? String(stock.cmp) : '');
      setQuantity('');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, stock, defaultAction]);

  if (!isOpen || !stock) return null;

  const numPrice = parseFloat(price) || 0;
  const numQty = parseInt(quantity) || 0;
  const totalValue = numPrice * numQty;

  // P&L preview for sells
  const pnlPreview = action === 'SELL' && currentHolding && numQty > 0 && numPrice > 0 ? {
    invested: currentHolding.purchasePrice * numQty,
    returns: numPrice * numQty,
    profit: (numPrice - currentHolding.purchasePrice) * numQty,
    profitPercent: ((numPrice - currentHolding.purchasePrice) / currentHolding.purchasePrice) * 100,
  } : null;

  const handleSubmit = async () => {
    if (numPrice <= 0 || numQty <= 0) {
      setError('Price and quantity must be positive');
      return;
    }
    if (action === 'SELL' && currentHolding && numQty > currentHolding.quantity) {
      setError(`You only hold ${currentHolding.quantity} shares`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await executeTrade({
        nseCode: stock.nseCode,
        name: stock.name,
        sector: stock.sector,
        action,
        price: numPrice,
        quantity: numQty,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onTradeComplete();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{stock.name}</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono">{stock.nseCode} • {stock.sector}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)]">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${action === 'BUY' ? 'bg-gain/10' : 'bg-loss/10'}`}>
              {action === 'BUY' ? <TrendingUp className="w-8 h-8 text-gain" /> : <TrendingDown className="w-8 h-8 text-loss" />}
            </div>
            <p className="mt-4 text-lg font-bold text-[var(--text-primary)]">
              {action === 'BUY' ? 'Purchase' : 'Sale'} Successful!
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {numQty} shares of {stock.nseCode} at {formatCurrency(numPrice)}
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="flex rounded-xl bg-[var(--bg-secondary)] p-1">
              <button
                onClick={() => setAction('BUY')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  action === 'BUY' ? 'bg-gain text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                BUY
              </button>
              <button
                onClick={() => setAction('SELL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  action === 'SELL' ? 'bg-loss text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                SELL
              </button>
            </div>

            {/* Current Holding Info */}
            {currentHolding && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/10 text-xs text-[var(--text-secondary)]">
                <DollarSign className="w-3 h-3" />
                Holding: {currentHolding.quantity} shares @ {formatCurrency(currentHolding.purchasePrice)} avg
              </div>
            )}

            {/* Price Input */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Price per share (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="0"
              />
              {action === 'SELL' && currentHolding && (
                <button
                  onClick={() => setQuantity(String(currentHolding.quantity))}
                  className="text-xs text-[var(--accent)] mt-1 hover:underline"
                >
                  Sell all ({currentHolding.quantity} shares)
                </button>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Add trade notes..."
              />
            </div>

            {/* Total Value */}
            {totalValue > 0 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <span className="text-sm text-[var(--text-secondary)]">Total Value</span>
                <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            )}

            {/* P&L Preview for Sells */}
            {pnlPreview && (
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                pnlPreview.profit >= 0 ? 'bg-gain/5 border-gain/20' : 'bg-loss/5 border-loss/20'
              }`}>
                <span className="text-sm text-[var(--text-secondary)]">Expected P&L</span>
                <div className="text-right">
                  <span className={`text-lg font-bold font-mono ${pnlPreview.profit >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {pnlPreview.profit >= 0 ? '+' : ''}{formatCurrency(pnlPreview.profit)}
                  </span>
                  <span className={`block text-xs ${pnlPreview.profit >= 0 ? 'text-gain/70' : 'text-loss/70'}`}>
                    {pnlPreview.profitPercent >= 0 ? '+' : ''}{pnlPreview.profitPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/10 border border-loss/20">
                <AlertCircle className="w-4 h-4 text-loss flex-shrink-0" />
                <span className="text-sm text-loss">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || numPrice <= 0 || numQty <= 0}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'BUY'
                  ? 'bg-gain hover:bg-gain/90 shadow-lg shadow-gain/25'
                  : 'bg-loss hover:bg-loss/90 shadow-lg shadow-loss/25'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                `${action === 'BUY' ? 'Buy' : 'Sell'} ${numQty > 0 ? numQty : ''} shares${totalValue > 0 ? ` for ${formatCurrency(totalValue)}` : ''}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

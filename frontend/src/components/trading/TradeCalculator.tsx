'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';

export function TradeCalculator() {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const calc = useMemo(() => {
    const bp = parseFloat(buyPrice) || 0;
    const sp = parseFloat(sellPrice) || 0;
    const qty = parseInt(quantity) || 0;
    if (bp <= 0 || sp <= 0 || qty <= 0) return null;

    const investment = bp * qty;
    const returns = sp * qty;
    const profit = returns - investment;
    const profitPercent = (profit / investment) * 100;

    return { investment, returns, profit, profitPercent };
  }, [buyPrice, sellPrice, quantity]);

  const reset = () => {
    setBuyPrice('');
    setSellPrice('');
    setQuantity('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">P&L Calculator</h3>
          </div>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Buy Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Sell Price (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="0"
            />
          </div>

          {calc && (
            <div className="space-y-2 mt-4 pt-4 border-t border-[var(--border)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Investment</span>
                <span className="font-mono text-[var(--text-secondary)]">{formatCurrency(calc.investment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Returns</span>
                <span className="font-mono text-[var(--text-secondary)]">{formatCurrency(calc.returns)}</span>
              </div>
              <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                calc.profit >= 0 ? 'bg-gain/10' : 'bg-loss/10'
              }`}>
                <div className="flex items-center gap-1.5">
                  {calc.profit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-gain" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-loss" />
                  )}
                  <span className={`text-sm font-medium ${calc.profit >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {calc.profit >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${calc.profit >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {calc.profit >= 0 ? '+' : ''}{formatCurrency(calc.profit)}
                  </span>
                  <span className={`block text-xs font-mono ${calc.profit >= 0 ? 'text-gain/70' : 'text-loss/70'}`}>
                    {calc.profitPercent >= 0 ? '+' : ''}{calc.profitPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

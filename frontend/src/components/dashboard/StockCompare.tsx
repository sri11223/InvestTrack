'use client';

import React, { useMemo, memo } from 'react';
import { PortfolioSummary, PortfolioStock } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';

interface StockCompareProps {
  portfolio: PortfolioSummary;
}

function getAllStocks(p: PortfolioSummary): PortfolioStock[] {
  return p.sectors.flatMap((s) => s.stocks);
}

export const StockCompare = memo(function StockCompare({ portfolio }: StockCompareProps) {
  const stocks = useMemo(() => getAllStocks(portfolio), [portfolio]);
  const [stockA, setStockA] = React.useState('');
  const [stockB, setStockB] = React.useState('');

  const a = useMemo(() => stocks.find((s) => s.nseCode === stockA), [stocks, stockA]);
  const b = useMemo(() => stocks.find((s) => s.nseCode === stockB), [stocks, stockB]);

  const metrics = useMemo(() => {
    if (!a || !b) return null;
    return [
      { label: 'CMP', valA: formatCurrency(a.cmp), valB: formatCurrency(b.cmp), better: a.cmp > b.cmp ? 'A' : 'B' },
      { label: 'Investment', valA: formatCurrency(a.investment), valB: formatCurrency(b.investment), better: null },
      { label: 'Gain/Loss %', valA: formatPercent(a.gainLossPercent), valB: formatPercent(b.gainLossPercent), better: a.gainLossPercent > b.gainLossPercent ? 'A' : 'B' },
      { label: 'Day Change %', valA: formatPercent(a.dayChangePercent), valB: formatPercent(b.dayChangePercent), better: a.dayChangePercent > b.dayChangePercent ? 'A' : 'B' },
      { label: 'P/E Ratio', valA: a.peRatio?.toFixed(1) ?? '—', valB: b.peRatio?.toFixed(1) ?? '—', better: a.peRatio && b.peRatio ? (a.peRatio < b.peRatio ? 'A' : 'B') : null },
      { label: 'Portfolio Weight', valA: `${a.portfolioWeight.toFixed(1)}%`, valB: `${b.portfolioWeight.toFixed(1)}%`, better: a.portfolioWeight > b.portfolioWeight ? 'A' : 'B' },
      { label: 'Quantity', valA: `${a.quantity}`, valB: `${b.quantity}`, better: null },
    ];
  }, [a, b]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={stockA}
          onChange={(e) => setStockA(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">Select Stock A</option>
          {stocks.map((s) => (
            <option key={s.nseCode} value={s.nseCode} disabled={s.nseCode === stockB}>
              {s.nseCode} — {s.name}
            </option>
          ))}
        </select>
        <select
          value={stockB}
          onChange={(e) => setStockB(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">Select Stock B</option>
          {stocks.map((s) => (
            <option key={s.nseCode} value={s.nseCode} disabled={s.nseCode === stockA}>
              {s.nseCode} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {metrics ? (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1">
            <span>Metric</span>
            <span className="text-center">{a!.nseCode}</span>
            <span className="text-center">{b!.nseCode}</span>
          </div>
          {metrics.map((m) => (
            <div key={m.label} className="grid grid-cols-3 text-sm px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <span className="text-[var(--text-secondary)]">{m.label}</span>
              <span className={`text-center font-mono ${m.better === 'A' ? 'text-gain font-semibold' : 'text-[var(--text-primary)]'}`}>
                {m.valA}
              </span>
              <span className={`text-center font-mono ${m.better === 'B' ? 'text-gain font-semibold' : 'text-[var(--text-primary)]'}`}>
                {m.valB}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-[var(--text-muted)]">
          Select two stocks to compare their performance
        </div>
      )}
    </div>
  );
});

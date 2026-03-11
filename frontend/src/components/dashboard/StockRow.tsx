'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart, ArrowDownCircle, Trash2 } from 'lucide-react';
import { PortfolioStock, StockSearchResult } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import { isGain } from '@/utils/calculations';

interface StockRowProps {
  stock: PortfolioStock;
  index: number;
  onBuy?: (stock: StockSearchResult) => void;
  onSell?: (stock: StockSearchResult, currentHolding: { quantity: number; purchasePrice: number }) => void;
  onRemove?: (id: string) => void;
}

/**
 * A single stock row in the portfolio table.
 * Memoized to prevent unnecessary re-renders when other stocks update.
 */
export const StockRow = memo(function StockRow({ stock, index, onBuy, onSell, onRemove }: StockRowProps) {
  const gain = isGain(stock.gainLoss);
  const dayGain = isGain(stock.dayChange);

  // Dynamic hold/buy/sell recommendation based on P&L
  const recommendation = (() => {
    if (stock.cmp <= 0) return null;
    const pct = stock.gainLossPercent;
    if (pct <= -10) return { label: 'Avg Down', color: 'bg-blue-500/15 text-blue-400' };
    if (pct < 0) return { label: 'Hold', color: 'bg-yellow-500/15 text-yellow-400' };
    if (pct >= 30) return { label: 'Book Profit', color: 'bg-gain/15 text-gain' };
    if (pct >= 15) return { label: 'Trail SL', color: 'bg-[var(--accent)]/15 text-[var(--accent)]' };
    return { label: 'Hold', color: 'bg-yellow-500/15 text-yellow-400' };
  })();

  const asSearchResult: StockSearchResult = {
    symbol: stock.symbol,
    nseCode: stock.nseCode,
    name: stock.name,
    sector: stock.sector,
    exchange: 'NSE',
    cmp: stock.cmp,
  };

  return (
    <tr className="table-row text-sm">
      {/* # */}
      <td className="px-3 py-3 text-[var(--text-muted)] font-mono text-xs">
        {index + 1}
      </td>

      {/* Stock Name */}
      <td className="px-3 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
              {stock.name}
            </p>
            {recommendation && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${recommendation.color}`}>
                {recommendation.label}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {stock.nseCode}
          </p>
        </div>
      </td>

      {/* NSE/BSE */}
      <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">
        <div>
          <span className="text-[var(--text-muted)]">NSE:</span> {stock.nseCode}
        </div>
        <div className="mt-0.5">
          <span className="text-[var(--text-muted)]">BSE:</span> {stock.bseCode}
        </div>
      </td>

      {/* Purchase Price */}
      <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)]">
        {formatCurrency(stock.purchasePrice)}
      </td>

      {/* Qty */}
      <td className="px-3 py-3 text-center font-mono text-[var(--text-secondary)]">
        {stock.quantity}
      </td>

      {/* Investment */}
      <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)]">
        {formatCurrency(stock.investment)}
      </td>

      {/* Portfolio % */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center">
          <div className="w-12 bg-[var(--bg-secondary)] rounded-full h-1.5 mr-2">
            <div
              className="bg-[var(--accent)] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stock.portfolioWeight, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {formatNumber(stock.portfolioWeight, 1)}%
          </span>
        </div>
      </td>

      {/* CMP (Live) */}
      <td className="px-3 py-3 text-right">
        <div className="font-mono font-semibold text-[var(--text-primary)]">
          {stock.cmp > 0 ? formatCurrency(stock.cmp) : '—'}
        </div>
        {stock.cmp > 0 && (
          <div className={`flex items-center justify-end gap-1 text-xs mt-0.5 ${dayGain ? 'text-gain' : 'text-loss'}`}>
            {dayGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(stock.dayChangePercent)}
          </div>
        )}
      </td>

      {/* Present Value */}
      <td className="px-3 py-3 text-right font-mono font-medium text-[var(--text-primary)]">
        {stock.cmp > 0 ? formatCurrency(stock.presentValue) : '—'}
      </td>

      {/* Gain/Loss */}
      <td className="px-3 py-3 text-right">
        {stock.cmp > 0 ? (
          <div>
            <p className={`font-mono font-semibold ${gain ? 'text-gain' : 'text-loss'}`}>
              {gain ? '+' : ''}{formatCurrency(stock.gainLoss)}
            </p>
            <p className={`text-xs font-mono mt-0.5 ${gain ? 'text-gain/80' : 'text-loss/80'}`}>
              {formatPercent(stock.gainLossPercent)}
            </p>
          </div>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        )}
      </td>

      {/* P/E Ratio */}
      <td className="px-3 py-3 text-center font-mono text-[var(--text-secondary)]">
        {stock.peRatio !== null ? formatNumber(stock.peRatio, 1) : '—'}
      </td>

      {/* Latest Earnings */}
      <td className="px-3 py-3 text-center font-mono text-xs text-[var(--text-secondary)]">
        {stock.latestEarnings ?? '—'}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onBuy?.(asSearchResult)}
            className="p-1.5 rounded-lg bg-gain/10 text-gain hover:bg-gain/20 transition-colors"
            title="Buy more"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSell?.(asSearchResult, { quantity: stock.quantity, purchasePrice: stock.purchasePrice })}
            className="p-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            title="Sell"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove?.(stock.id)}
            className="p-1.5 rounded-lg bg-loss/10 text-loss hover:bg-loss/20 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

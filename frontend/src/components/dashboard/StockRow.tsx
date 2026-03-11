'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { PortfolioStock } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import { isGain } from '@/utils/calculations';

interface StockRowProps {
  stock: PortfolioStock;
  index: number;
}

/**
 * A single stock row in the portfolio table.
 * Memoized to prevent unnecessary re-renders when other stocks update.
 */
export const StockRow = memo(function StockRow({ stock, index }: StockRowProps) {
  const gain = isGain(stock.gainLoss);
  const dayGain = isGain(stock.dayChange);

  return (
    <tr className="table-row text-sm">
      {/* # */}
      <td className="px-3 py-3 text-[var(--text-muted)] font-mono text-xs">
        {index + 1}
      </td>

      {/* Stock Name */}
      <td className="px-3 py-3">
        <div>
          <p className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
            {stock.name}
          </p>
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
      <td className="px-3 py-3 text-center text-xs text-[var(--text-secondary)]">
        {stock.latestEarnings || '—'}
      </td>
    </tr>
  );
});

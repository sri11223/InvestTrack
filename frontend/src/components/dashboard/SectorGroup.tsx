'use client';

import React, { useState, memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SectorSummary, StockSearchResult } from '@/types';
import { StockRow } from './StockRow';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { isGain } from '@/utils/calculations';
import { SECTOR_COLORS } from '@/constants';

interface SectorGroupProps {
  sector: SectorSummary;
  startIndex: number;
  onBuy?: (stock: StockSearchResult) => void;
  onSell?: (stock: StockSearchResult, currentHolding: { quantity: number; purchasePrice: number }) => void;
  onRemove?: (id: string) => void;
}

/**
 * Collapsible sector group with summary row and individual stock rows.
 * Default expanded for better UX.
 */
export const SectorGroup = memo(function SectorGroup({ sector, startIndex, onBuy, onSell, onRemove }: SectorGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const gain = isGain(sector.gainLoss);
  const sectorColor = SECTOR_COLORS[sector.sector] || '#6b7280';

  return (
    <>
      {/* Sector Header Row */}
      <tr
        className="cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td colSpan={13} className="px-0 py-0">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors duration-150 border-y border-[var(--border)]">
            {/* Left: Sector name */}
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: sectorColor }}
              />
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              )}
              <div>
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  {sector.sector}
                </span>
                <span className="ml-2 text-xs text-[var(--text-muted)]">
                  ({sector.stockCount} {sector.stockCount === 1 ? 'stock' : 'stocks'})
                </span>
              </div>
            </div>

            {/* Right: Sector summary numbers */}
            <div className="flex items-center gap-6 text-xs">
              <div className="text-right">
                <p className="text-[var(--text-muted)]">Investment</p>
                <p className="font-mono font-medium text-[var(--text-secondary)]">
                  {formatCurrency(sector.totalInvestment)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[var(--text-muted)]">Present Value</p>
                <p className="font-mono font-medium text-[var(--text-primary)]">
                  {formatCurrency(sector.totalPresentValue)}
                </p>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="text-[var(--text-muted)]">Gain/Loss</p>
                <p className={`font-mono font-semibold ${gain ? 'text-gain' : 'text-loss'}`}>
                  {gain ? '+' : ''}{formatCurrency(sector.gainLoss)}
                  <span className="ml-1 text-[10px]">
                    ({formatPercent(sector.gainLossPercent)})
                  </span>
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Stock Rows */}
      {isExpanded &&
        sector.stocks.map((stock, idx) => (
          <StockRow
            key={stock.symbol}
            stock={stock}
            index={startIndex + idx}
            onBuy={onBuy}
            onSell={onSell}
            onRemove={onRemove}
          />
        ))}
    </>
  );
});

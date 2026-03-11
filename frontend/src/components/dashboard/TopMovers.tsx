'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { PortfolioSummary, PortfolioStock } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';

interface TopMoversProps {
  portfolio: PortfolioSummary;
}

function getAllStocks(portfolio: PortfolioSummary): PortfolioStock[] {
  return portfolio.sectors.flatMap((s) => s.stocks);
}

function exportPortfolioCSV(portfolio: PortfolioSummary) {
  const stocks = getAllStocks(portfolio);
  const headers = ['Name', 'NSE Code', 'Sector', 'Qty', 'Purchase Price', 'CMP', 'Investment', 'Present Value', 'Gain/Loss', 'Gain/Loss %', 'Day Change %'];
  const rows = stocks.map((s) => [
    s.name, s.nseCode, s.sector, s.quantity,
    s.purchasePrice.toFixed(2), s.cmp.toFixed(2),
    s.investment.toFixed(2), s.presentValue.toFixed(2),
    s.gainLoss.toFixed(2), s.gainLossPercent.toFixed(2),
    s.dayChangePercent.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `investtrack-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TopMovers({ portfolio }: TopMoversProps) {
  const { topGainer, topLoser, topDayGainer, topDayLoser } = useMemo(() => {
    const stocks = getAllStocks(portfolio).filter((s) => s.cmp > 0);
    const sorted = [...stocks].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const daySorted = [...stocks].sort((a, b) => b.dayChangePercent - a.dayChangePercent);
    return {
      topGainer: sorted[0] || null,
      topLoser: sorted[sorted.length - 1] || null,
      topDayGainer: daySorted[0] || null,
      topDayLoser: daySorted[daySorted.length - 1] || null,
    };
  }, [portfolio]);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex flex-wrap gap-3 flex-1">
        {/* Overall top gainer */}
        {topGainer && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gain/5 border border-gain/10">
            <TrendingUp className="w-4 h-4 text-gain" />
            <div className="text-xs">
              <span className="text-[var(--text-muted)]">Top Gainer</span>
              <p className="font-semibold text-gain">{topGainer.nseCode} {formatPercent(topGainer.gainLossPercent)}</p>
            </div>
          </div>
        )}

        {/* Overall top loser */}
        {topLoser && topLoser.gainLossPercent < 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/5 border border-loss/10">
            <TrendingDown className="w-4 h-4 text-loss" />
            <div className="text-xs">
              <span className="text-[var(--text-muted)]">Top Loser</span>
              <p className="font-semibold text-loss">{topLoser.nseCode} {formatPercent(topLoser.gainLossPercent)}</p>
            </div>
          </div>
        )}

        {/* Today's top gainer */}
        {topDayGainer && topDayGainer.dayChangePercent > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gain/5 border border-gain/10">
            <TrendingUp className="w-4 h-4 text-gain" />
            <div className="text-xs">
              <span className="text-[var(--text-muted)]">Today&apos;s Best</span>
              <p className="font-semibold text-gain">{topDayGainer.nseCode} {formatPercent(topDayGainer.dayChangePercent)}</p>
            </div>
          </div>
        )}

        {/* Today's top loser */}
        {topDayLoser && topDayLoser.dayChangePercent < 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-loss/5 border border-loss/10">
            <TrendingDown className="w-4 h-4 text-loss" />
            <div className="text-xs">
              <span className="text-[var(--text-muted)]">Today&apos;s Worst</span>
              <p className="font-semibold text-loss">{topDayLoser.nseCode} {formatPercent(topDayLoser.dayChangePercent)}</p>
            </div>
          </div>
        )}
      </div>

      {/* CSV Export */}
      <button
        onClick={() => exportPortfolioCSV(portfolio)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
          bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </button>
    </div>
  );
}

'use client';

import React, { useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PortfolioSummary } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { SECTOR_COLORS } from '@/constants';

interface PerformanceAnalyticsProps {
  portfolio: PortfolioSummary;
}

export const PerformanceAnalytics = memo(function PerformanceAnalytics({ portfolio }: PerformanceAnalyticsProps) {
  const stats = useMemo(() => {
    const stocks = portfolio.sectors.flatMap((s) => s.stocks).filter((s) => s.cmp > 0);
    if (stocks.length === 0) return null;

    const gainers = stocks.filter((s) => s.gainLoss > 0);
    const losers = stocks.filter((s) => s.gainLoss < 0);
    const bestStock = stocks.reduce((a, b) => (a.gainLossPercent > b.gainLossPercent ? a : b));
    const worstStock = stocks.reduce((a, b) => (a.gainLossPercent < b.gainLossPercent ? a : b));
    const avgReturn = stocks.reduce((s, st) => s + st.gainLossPercent, 0) / stocks.length;
    const weightedReturn = portfolio.totalPresentValue > 0
      ? ((portfolio.totalPresentValue - portfolio.totalInvestment) / portfolio.totalInvestment) * 100
      : 0;

    // Sector performance for bar chart
    const sectorPerf = portfolio.sectors.map((s) => ({
      name: s.sector.length > 12 ? s.sector.slice(0, 12) + '…' : s.sector,
      fullName: s.sector,
      return: s.gainLossPercent,
      investment: s.totalInvestment,
      color: SECTOR_COLORS[s.sector] || '#6b7280',
    })).sort((a, b) => b.return - a.return);

    // Distribution histogram
    const buckets = [
      { range: '<-20%', min: -Infinity, max: -20, count: 0 },
      { range: '-20 to -10%', min: -20, max: -10, count: 0 },
      { range: '-10 to 0%', min: -10, max: 0, count: 0 },
      { range: '0 to 10%', min: 0, max: 10, count: 0 },
      { range: '10 to 20%', min: 10, max: 20, count: 0 },
      { range: '>20%', min: 20, max: Infinity, count: 0 },
    ];
    for (const s of stocks) {
      const b = buckets.find((b) => s.gainLossPercent >= b.min && s.gainLossPercent < b.max);
      if (b) b.count++;
    }

    return {
      totalStocks: stocks.length,
      gainers: gainers.length,
      losers: losers.length,
      bestStock,
      worstStock,
      avgReturn,
      weightedReturn,
      sectorPerf,
      distribution: buckets,
    };
  }, [portfolio]);

  if (!stats) {
    return <div className="text-center py-8 text-sm text-[var(--text-muted)]">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Win Rate" value={`${((stats.gainers / stats.totalStocks) * 100).toFixed(0)}%`} sub={`${stats.gainers}W / ${stats.losers}L`} color="text-gain" />
        <MetricCard label="Portfolio Return" value={`${stats.weightedReturn >= 0 ? '+' : ''}${stats.weightedReturn.toFixed(1)}%`} sub={formatCurrency(portfolio.totalGainLoss)} color={stats.weightedReturn >= 0 ? 'text-gain' : 'text-loss'} />
        <MetricCard label="Best Performer" value={stats.bestStock.nseCode} sub={formatPercent(stats.bestStock.gainLossPercent)} color="text-gain" />
        <MetricCard label="Worst Performer" value={stats.worstStock.nseCode} sub={formatPercent(stats.worstStock.gainLossPercent)} color="text-loss" />
      </div>

      {/* Sector Performance Chart */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Sector Returns</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.sectorPerf} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={80} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="card px-3 py-2 shadow-lg text-xs">
                      <p className="font-medium text-[var(--text-primary)]">{d.fullName}</p>
                      <p className="text-[var(--text-secondary)]">Return: <span className={`font-mono ${d.return >= 0 ? 'text-gain' : 'text-loss'}`}>{d.return.toFixed(1)}%</span></p>
                      <p className="text-[var(--text-muted)]">Invested: {formatCurrency(d.investment)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="return" radius={[0, 4, 4, 0]}>
                {stats.sectorPerf.map((entry, i) => (
                  <Cell key={i} fill={entry.return >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Return Distribution */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Return Distribution</h4>
        <div className="flex items-end gap-1.5 h-20">
          {stats.distribution.map((b) => {
            const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);
            const height = (b.count / maxCount) * 100;
            const isNeg = b.min < 0;
            return (
              <div key={b.range} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-[var(--text-muted)]">{b.count}</span>
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 ${isNeg ? 'bg-loss/60' : 'bg-gain/60'}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <span className="text-[8px] text-[var(--text-muted)] whitespace-nowrap">{b.range}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
      <p className={`text-xs font-mono ${color} opacity-70`}>{sub}</p>
    </div>
  );
}

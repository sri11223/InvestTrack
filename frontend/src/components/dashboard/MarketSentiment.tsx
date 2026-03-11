'use client';

import React, { useMemo, memo } from 'react';
import { PortfolioSummary } from '@/types';

interface MarketSentimentProps {
  portfolio: PortfolioSummary;
}

/**
 * Calculates a portfolio-based "sentiment score" from 0–100 derived from:
 * - % of stocks in gain vs loss
 * - Average gain/loss magnitude
 * - Today's gainers vs losers
 */
export const MarketSentiment = memo(function MarketSentiment({ portfolio }: MarketSentimentProps) {
  const { score, label, color, segments } = useMemo(() => {
    const stocks = portfolio.sectors.flatMap((s) => s.stocks).filter((s) => s.cmp > 0);
    if (stocks.length === 0) return { score: 50, label: 'Neutral', color: '#f59e0b', segments: [] };

    const gainers = stocks.filter((s) => s.gainLoss > 0).length;
    const dayGainers = stocks.filter((s) => s.dayChange > 0).length;
    const avgGainPct = stocks.reduce((s, st) => s + st.gainLossPercent, 0) / stocks.length;
    const avgDayPct = stocks.reduce((s, st) => s + st.dayChangePercent, 0) / stocks.length;

    // Score components (each 0–25)
    const gainRatio = (gainers / stocks.length) * 25;
    const dayRatio = (dayGainers / stocks.length) * 25;
    const magnitudeScore = Math.min(25, Math.max(0, (avgGainPct + 20) * (25 / 40)));
    const dayMagnitude = Math.min(25, Math.max(0, (avgDayPct + 3) * (25 / 6)));

    const raw = gainRatio + dayRatio + magnitudeScore + dayMagnitude;
    const clamped = Math.round(Math.min(100, Math.max(0, raw)));

    let lbl: string, clr: string;
    if (clamped >= 80) { lbl = 'Extreme Greed'; clr = '#22c55e'; }
    else if (clamped >= 60) { lbl = 'Greed'; clr = '#4ade80'; }
    else if (clamped >= 40) { lbl = 'Neutral'; clr = '#f59e0b'; }
    else if (clamped >= 20) { lbl = 'Fear'; clr = '#f87171'; }
    else { lbl = 'Extreme Fear'; clr = '#ef4444'; }

    return {
      score: clamped,
      label: lbl,
      color: clr,
      segments: [
        { label: 'Gainers', value: `${gainers}/${stocks.length}`, pct: (gainers / stocks.length) * 100 },
        { label: 'Today Up', value: `${dayGainers}/${stocks.length}`, pct: (dayGainers / stocks.length) * 100 },
        { label: 'Avg P&L', value: `${avgGainPct >= 0 ? '+' : ''}${avgGainPct.toFixed(1)}%`, pct: Math.min(100, Math.max(0, (avgGainPct + 30) * (100 / 60))) },
      ],
    };
  }, [portfolio]);

  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="flex flex-col items-center">
      {/* Gauge */}
      <div className="relative w-40 h-20 overflow-hidden mb-2">
        {/* Background arc */}
        <div className="absolute inset-0 rounded-t-full"
          style={{
            background: `conic-gradient(from 0.75turn, #ef4444 0%, #f59e0b 25%, #22c55e 50%)`,
            clipPath: 'polygon(0 100%, 0 0, 100% 0, 100% 100%)',
          }}
        />
        {/* Inner cutout */}
        <div className="absolute inset-[8px] rounded-t-full bg-[var(--bg-card)]" />
        {/* Needle */}
        <div className="absolute bottom-0 left-1/2 w-0.5 h-[60px] origin-bottom bg-[var(--text-primary)]"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transition: 'transform 1s ease-out' }}
        />
        {/* Center dot */}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--text-primary)] border-2 border-[var(--bg-card)]" />
      </div>

      {/* Score + Label */}
      <div className="text-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{score}</span>
        <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
      </div>

      {/* Breakdown */}
      <div className="w-full mt-4 space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)] w-16 flex-shrink-0">{seg.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${seg.pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)] w-14 text-right">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

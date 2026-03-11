'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { fetchChartData } from '@/services/stockService';
import { CandlestickData } from '@/types';

interface StockChartProps {
  symbol: string;
  nseCode?: string;
  height?: number;
}

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

export function StockChart({ symbol, nseCode, height = 300 }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1M');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChart = useCallback(async () => {
    const code = nseCode || symbol;
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchChartData(code, period);
      setChartData(result.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load chart';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [symbol, nseCode, period]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  const { changePercent, isPositive } = useMemo(() => {
    if (chartData.length < 2) return { changePercent: 0, isPositive: true };
    const first = chartData[0].close;
    const last = chartData[chartData.length - 1].close;
    const pct = first > 0 ? ((last - first) / first) * 100 : 0;
    return { changePercent: pct, isPositive: pct >= 0 };
  }, [chartData]);

  const avgPrice = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((s, d) => s + d.close, 0) / chartData.length;
  }, [chartData]);

  const displaySymbol = nseCode || symbol;

  return (
    <div className="space-y-3">
      {/* Period Selector + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-muted)]">{displaySymbol}</span>
          {chartData.length > 0 && (
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button onClick={loadChart} className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]" title="Retry">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex rounded-lg bg-[var(--bg-secondary)] p-0.5">
            {(['1W', '1M', '3M', '6M', '1Y'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs rounded-md transition-all ${
                  period === p
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]" style={{ height }}>
          <p className="text-xs">{error}</p>
          <button onClick={loadChart} className="text-xs text-[var(--accent)] hover:underline">Retry</button>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--gain)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--gain)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--loss)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--loss)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => {
                const date = new Date(d);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
              interval={Math.max(1, Math.floor(chartData.length / 6))}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `₹${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelFormatter={(label: string) => `Date: ${label}`}
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <ReferenceLine
              y={avgPrice}
              stroke="var(--accent)"
              strokeDasharray="5 5"
              opacity={0.5}
              label={{ value: 'Avg', position: 'insideTopRight', fill: 'var(--text-muted)', fontSize: 10 }}
            />
            {/* Volume bars */}
            <Bar dataKey="volume" fill="var(--accent)" opacity={0.08} yAxisId="volume" />
            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke={isPositive ? 'var(--gain)' : 'var(--loss)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? 'var(--gain)' : 'var(--loss)' }}
            />
            {/* High/Low as reference */}
            <Line type="monotone" dataKey="high" stroke="var(--gain)" strokeWidth={0.5} strokeDasharray="2 4" dot={false} opacity={0.3} />
            <Line type="monotone" dataKey="low" stroke="var(--loss)" strokeWidth={0.5} strokeDasharray="2 4" dot={false} opacity={0.3} />
            <YAxis yAxisId="volume" orientation="right" hide />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Empty state */}
      {!loading && !error && chartData.length === 0 && (
        <div className="flex items-center justify-center text-xs text-[var(--text-muted)]" style={{ height }}>
          No chart data available
        </div>
      )}
    </div>
  );
}

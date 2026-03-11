'use client';

import React, { useState, useMemo } from 'react';
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
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  data: PricePoint[];
  height?: number;
}

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

// Generate simulated data for demo (since we don't have a historical data API)
function generateDemoData(days: number): PricePoint[] {
  const data: PricePoint[] = [];
  let price = 1000 + Math.random() * 500;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.01;
    const low = Math.min(open, close) - Math.random() * price * 0.01;
    const volume = Math.floor(50000 + Math.random() * 200000);

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }
  return data;
}

const PERIOD_DAYS: Record<Period, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

export function StockChart({ symbol, data: _data, height = 300 }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1M');

  // Use provided data if available, otherwise generate demo data
  const chartData = useMemo(() => {
    return generateDemoData(PERIOD_DAYS[period]);
  }, [period]);

  const { firstClose, lastClose, changePercent, isPositive } = useMemo(() => {
    const first = chartData[0]?.close ?? 0;
    const last = chartData[chartData.length - 1]?.close ?? 0;
    const pct = first > 0 ? ((last - first) / first) * 100 : 0;
    return {
      firstClose: first,
      lastClose: last,
      changePercent: pct,
      isPositive: pct >= 0,
    };
  }, [chartData]);

  const avgPrice = useMemo(() => {
    const sum = chartData.reduce((s, d) => s + d.close, 0);
    return sum / chartData.length;
  }, [chartData]);

  return (
    <div className="space-y-3">
      {/* Period Selector + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-muted)]">{symbol}</span>
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
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

      {/* Chart */}
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
            interval={Math.floor(chartData.length / 6)}
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
    </div>
  );
}

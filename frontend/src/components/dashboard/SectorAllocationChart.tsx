'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { PortfolioSummary } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { isGain } from '@/utils/calculations';
import { SECTOR_COLORS } from '@/constants';

interface SectorAllocationChartProps {
  portfolio: PortfolioSummary;
}

export function SectorAllocationChart({ portfolio }: SectorAllocationChartProps) {
  const chartData = portfolio.sectors.map((sector) => ({
    name: sector.sector,
    value: sector.totalInvestment,
    presentValue: sector.totalPresentValue,
    gainLoss: sector.gainLoss,
    gainLossPercent: sector.gainLossPercent,
    color: SECTOR_COLORS[sector.sector] || '#6b7280',
  }));

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
        Sector Allocation
      </h3>

      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="card px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        {data.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatCurrency(data.value)}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.map((item) => {
            const gain = isGain(item.gainLoss);
            const weight = (item.value / portfolio.totalInvestment) * 100;

            return (
              <div
                key={item.name}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-[var(--text-muted)]">
                    {weight.toFixed(1)}%
                  </span>
                  <span className={`font-mono font-medium ${gain ? 'text-gain' : 'text-loss'}`}>
                    {formatPercent(item.gainLossPercent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

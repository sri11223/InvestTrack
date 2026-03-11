'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { PortfolioSummary } from '@/types';
import { SectorGroup } from './SectorGroup';

interface PortfolioTableProps {
  portfolio: PortfolioSummary;
}

const TABLE_HEADERS = [
  { key: '#', label: '#', align: 'left' as const, width: 'w-10' },
  { key: 'name', label: 'Particulars', align: 'left' as const, width: 'min-w-[180px]' },
  { key: 'exchange', label: 'NSE/BSE', align: 'left' as const, width: 'w-24' },
  { key: 'purchasePrice', label: 'Purchase Price', align: 'right' as const, width: 'w-32' },
  { key: 'qty', label: 'Qty', align: 'center' as const, width: 'w-16' },
  { key: 'investment', label: 'Investment', align: 'right' as const, width: 'w-32' },
  { key: 'weight', label: 'Portfolio %', align: 'center' as const, width: 'w-32' },
  { key: 'cmp', label: 'CMP ●', align: 'right' as const, width: 'w-32' },
  { key: 'presentValue', label: 'Present Value', align: 'right' as const, width: 'w-32' },
  { key: 'gainLoss', label: 'Gain/Loss', align: 'right' as const, width: 'w-36' },
  { key: 'pe', label: 'P/E Ratio', align: 'center' as const, width: 'w-24' },
  { key: 'earnings', label: 'Latest Earnings', align: 'center' as const, width: 'w-28' },
];

export function PortfolioTable({ portfolio }: PortfolioTableProps) {
  let runningIndex = 0;

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Portfolio Holdings
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Grouped by sector &bull; CMP updates every 15s &bull;{' '}
            <span className="inline-flex items-center gap-1">
              <span className="live-indicator" /> Live
            </span>
          </p>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {portfolio.sectors.reduce((sum, s) => sum + s.stockCount, 0)} stocks across{' '}
          {portfolio.sectors.length} sectors
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="table-header">
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={`
                    px-3 py-3 ${header.width}
                    text-${header.align}
                    whitespace-nowrap
                  `}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {portfolio.sectors.map((sector) => {
              const startIndex = runningIndex;
              runningIndex += sector.stockCount;
              return (
                <SectorGroup
                  key={sector.sector}
                  sector={sector}
                  startIndex={startIndex}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

'use client';

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Wallet, PieChart, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PortfolioSummary } from '@/types';
import { formatCompactCurrency, formatPercent, formatCurrency } from '@/utils/formatters';
import { isGain } from '@/utils/calculations';

interface PortfolioSummaryCardsProps {
  portfolio: PortfolioSummary;
}

export const PortfolioSummaryCards = memo(function PortfolioSummaryCards({ portfolio }: PortfolioSummaryCardsProps) {
  const {
    totalInvestment,
    totalPresentValue,
    totalGainLoss,
    totalGainLossPercent,
  } = portfolio;

  const gain = isGain(totalGainLoss);
  const dayGainLoss = portfolio.sectors.reduce(
    (sum, s) => sum + s.stocks.reduce((ss, st) => ss + st.dayChange * st.quantity, 0),
    0
  );
  const dayGainPct =
    totalPresentValue > 0
      ? (dayGainLoss / (totalPresentValue - dayGainLoss)) * 100
      : 0;
  const isDayGain = dayGainLoss >= 0;

  const cards = [
    {
      title: 'Total Investment',
      value: formatCompactCurrency(totalInvestment),
      subtitle: formatCurrency(totalInvestment),
      icon: Wallet,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: 'Present Value',
      value: formatCompactCurrency(totalPresentValue),
      subtitle: formatCurrency(totalPresentValue),
      icon: PieChart,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
    },
    {
      title: 'Total Gain/Loss',
      value: formatCompactCurrency(totalGainLoss),
      subtitle: formatPercent(totalGainLossPercent),
      icon: gain ? TrendingUp : TrendingDown,
      iconColor: gain ? 'text-gain' : 'text-loss',
      iconBg: gain ? 'bg-gain/10' : 'bg-loss/10',
      valueColor: gain ? 'text-gain' : 'text-loss',
    },
    {
      title: "Today's Change",
      value: formatCompactCurrency(dayGainLoss),
      subtitle: formatPercent(dayGainPct),
      icon: Activity,
      iconColor: isDayGain ? 'text-gain' : 'text-loss',
      iconBg: isDayGain ? 'bg-gain/10' : 'bg-loss/10',
      valueColor: isDayGain ? 'text-gain' : 'text-loss',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                {card.title}
              </p>
              <p className={`text-xl font-bold mt-1 ${card.valueColor || 'text-[var(--text-primary)]'}`}>
                {card.value}
              </p>
              <p className={`text-xs mt-1 ${card.valueColor || 'text-[var(--text-secondary)]'}`}>
                {card.subtitle}
              </p>
            </div>
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

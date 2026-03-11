'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Trade } from '@/types';
import { fetchTradeHistory } from '@/services/stockService';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

interface TradeHistoryPanelProps {
  refreshTrigger: number;
}

export function TradeHistoryPanel({ refreshTrigger }: TradeHistoryPanelProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrades = useCallback(async () => {
    try {
      const data = await fetchTradeHistory();
      setTrades(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrades(); }, [loadTrades, refreshTrigger]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Trade History</h3>
            {trades.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {trades.length}
              </span>
            )}
          </div>
          <button onClick={loadTrades} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trades.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No trades yet</p>
            <p className="text-xs mt-1">Execute a buy or sell to see history here</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
            {trades.slice(0, 50).map((trade) => (
              <li key={trade.id} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    trade.action === 'BUY' ? 'bg-gain/10' : 'bg-loss/10'
                  }`}>
                    {trade.action === 'BUY' ? (
                      <TrendingUp className="w-4 h-4 text-gain" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-loss" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {trade.action} {trade.quantity} × {trade.nseCode}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatDateTime(trade.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-mono font-medium ${trade.action === 'BUY' ? 'text-gain' : 'text-loss'}`}>
                    {trade.action === 'BUY' ? '-' : '+'}{formatCurrency(trade.totalValue)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    @ {formatCurrency(trade.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Trash2, Plus, TrendingUp, RefreshCw } from 'lucide-react';
import { WatchlistItem, StockSearchResult } from '@/types';
import { fetchWatchlist, removeFromWatchlist, addToWatchlist } from '@/services/stockService';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

interface WatchlistPanelProps {
  onBuyStock: (stock: StockSearchResult) => void;
  onOpenSearch: () => void;
  refreshTrigger: number;
}

export function WatchlistPanel({ onBuyStock, onOpenSearch, refreshTrigger }: WatchlistPanelProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatchlist = useCallback(async () => {
    try {
      const data = await fetchWatchlist();
      setItems(data);
    } catch {
      // Ignore — empty state will show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist, refreshTrigger]);

  const handleRemove = async (id: string) => {
    try {
      await removeFromWatchlist(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Watchlist</h3>
            {items.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={loadWatchlist} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onOpenSearch} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No stocks in watchlist</p>
            <button onClick={onOpenSearch} className="text-[var(--accent)] text-xs mt-1 hover:underline">
              Search &amp; add stocks
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="font-mono">{item.nseCode}</span>
                    <span>•</span>
                    <span>{item.sector}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onBuyStock({ symbol: item.symbol, nseCode: item.nseCode, name: item.name, sector: item.sector, exchange: 'NSE' })}
                    className="p-1.5 rounded-lg bg-gain/10 text-gain hover:bg-gain/20 transition-colors"
                    title="Buy"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg bg-loss/10 text-loss hover:bg-loss/20 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

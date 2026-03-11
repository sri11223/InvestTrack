'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Plus, Eye, CheckCircle2 } from 'lucide-react';
import { StockSearchResult } from '@/types';
import { searchStocks } from '@/services/stockService';

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuy: (stock: StockSearchResult) => void;
  onAddToWatchlist: (stock: StockSearchResult) => void;
}

export function StockSearchModal({ isOpen, onClose, onSelectBuy, onAddToWatchlist }: StockSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchedCodes, setWatchedCodes] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setWatchedCodes(new Set());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleWatch = useCallback((stock: StockSearchResult) => {
    onAddToWatchlist(stock);
    setWatchedCodes((prev) => new Set(prev).add(stock.nseCode));
  }, [onAddToWatchlist]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchStocks(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search stocks by name, symbol, or sector..."
            className="flex-1 bg-transparent text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length > 0 && results.length === 0 && (
            <div className="py-12 text-center text-[var(--text-muted)]">
              No stocks found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((stock) => (
                <li
                  key={stock.nseCode}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-sm flex-shrink-0">
                      {stock.nseCode.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">
                        {stock.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="font-mono">{stock.nseCode}</span>
                        <span>•</span>
                        <span>{stock.sector}</span>
                        {stock.cmp && stock.cmp > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-[var(--text-secondary)] font-mono">
                              ₹{stock.cmp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons — always visible */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onSelectBuy(stock)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gain/10 text-gain text-xs font-medium hover:bg-gain/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Buy
                    </button>
                    {watchedCodes.has(stock.nseCode) ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gain/10 text-gain text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Watching
                      </span>
                    ) : (
                      <button
                        onClick={() => handleWatch(stock)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border)]"
                      >
                        <Eye className="w-3 h-3" />
                        Watch
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.length === 0 && (
            <div className="py-12 text-center">
              <TrendingUp className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">
                Search for NSE stocks to buy or add to watchlist
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Try &ldquo;HDFC&rdquo;, &ldquo;Reliance&rdquo;, or &ldquo;Technology&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

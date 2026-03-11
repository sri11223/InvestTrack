'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/components/ui/Toast';

export interface PriceAlert {
  id: string;
  nseCode: string;
  name: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: string;
  triggered?: boolean;
}

const STORAGE_KEY = 'investtrack-price-alerts';

function loadAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAlerts(alerts: PriceAlert[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch { /* noop */ }
}

interface PriceAlertsProps {
  /** Current stock prices keyed by nseCode */
  currentPrices?: Map<string, number>;
  /** Available stock codes from portfolio */
  stockCodes?: { nseCode: string; name: string }[];
}

export function PriceAlerts({ currentPrices, stockCodes = [] }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const { toast } = useToast();

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  // Check alerts against live prices
  useEffect(() => {
    if (!currentPrices || currentPrices.size === 0) return;
    setAlerts((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (a.triggered) return a;
        const price = currentPrices.get(a.nseCode);
        if (price == null) return a;
        const hit = a.direction === 'above' ? price >= a.targetPrice : price <= a.targetPrice;
        if (hit) {
          changed = true;
          toast(`Alert: ${a.nseCode} hit ${formatCurrency(a.targetPrice)} (${a.direction})`, 'info');
          return { ...a, triggered: true };
        }
        return a;
      });
      if (changed) saveAlerts(next);
      return changed ? next : prev;
    });
  }, [currentPrices, toast]);

  const addAlert = useCallback(() => {
    const targetNum = parseFloat(target);
    if (!code || !targetNum || targetNum <= 0) return;
    const stock = stockCodes.find((s) => s.nseCode === code);
    const alert: PriceAlert = {
      id: `alert_${Date.now()}`,
      nseCode: code,
      name: stock?.name || code,
      targetPrice: targetNum,
      direction,
      createdAt: new Date().toISOString(),
    };
    const next = [alert, ...alerts];
    setAlerts(next);
    saveAlerts(next);
    setCode('');
    setTarget('');
    setShowForm(false);
    toast(`Alert set: ${code} ${direction} ${formatCurrency(targetNum)}`, 'success');
  }, [code, target, direction, alerts, stockCodes, toast]);

  const removeAlert = useCallback((id: string) => {
    const next = alerts.filter((a) => a.id !== id);
    setAlerts(next);
    saveAlerts(next);
  }, [alerts]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">Price Alerts</h3>
            {alerts.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {alerts.filter((a) => !a.triggered).length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {/* Add alert form */}
        {showForm && (
          <div className="px-6 py-3 border-b border-[var(--border)] space-y-2">
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Select stock...</option>
              {stockCodes.map((s) => (
                <option key={s.nseCode} value={s.nseCode}>{s.nseCode} — {s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Target price"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              onClick={addAlert}
              disabled={!code || !target}
              className="w-full py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              Set Alert
            </button>
          </div>
        )}

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--text-muted)]">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No price alerts</p>
            <button onClick={() => setShowForm(true)} className="text-[var(--accent)] text-xs mt-1 hover:underline">
              Set your first alert
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
            {alerts.map((a) => (
              <li key={a.id} className={`flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-secondary)] transition-colors ${a.triggered ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${a.direction === 'above' ? 'bg-gain/10' : 'bg-loss/10'}`}>
                    {a.direction === 'above' ? (
                      <TrendingUp className="w-3 h-3 text-gain" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-loss" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {a.nseCode}
                      {a.triggered && <span className="ml-1.5 text-[10px] text-gain font-semibold">TRIGGERED</span>}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      {a.direction === 'above' ? '≥' : '≤'} {formatCurrency(a.targetPrice)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAlert(a.id)}
                  className="p-1.5 rounded-lg hover:bg-loss/10 text-[var(--text-muted)] hover:text-loss transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

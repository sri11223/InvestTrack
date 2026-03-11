'use client';

import { useState, useCallback, useRef } from 'react';

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

const STORAGE_KEY = 'investtrack-widget-order';

function loadOrder(defaults: WidgetConfig[]): WidgetConfig[] {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const saved: { id: string; visible: boolean }[] = JSON.parse(raw);
    // Merge saved order with defaults (handle new/removed widgets)
    const defaultMap = new Map(defaults.map((d) => [d.id, d]));
    const ordered: WidgetConfig[] = [];
    for (const s of saved) {
      const def = defaultMap.get(s.id);
      if (def) {
        ordered.push({ ...def, visible: s.visible });
        defaultMap.delete(s.id);
      }
    }
    // Append any new widgets not in saved
    for (const d of defaultMap.values()) {
      ordered.push(d);
    }
    return ordered;
  } catch {
    return defaults;
  }
}

function saveOrder(widgets: WidgetConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets.map(({ id, visible }) => ({ id, visible }))));
  } catch { /* ignore */ }
}

export function useDashboardLayout(defaultWidgets: WidgetConfig[]) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadOrder(defaultWidgets));
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    setWidgets((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragItem.current!, 1);
      next.splice(dragOverItem.current!, 0, removed);
      dragItem.current = null;
      dragOverItem.current = null;
      saveOrder(next);
      return next;
    });
  }, []);

  const toggleWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
      saveOrder(next);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    saveOrder(defaultWidgets);
  }, [defaultWidgets]);

  return {
    widgets,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    toggleWidget,
    resetLayout,
  };
}

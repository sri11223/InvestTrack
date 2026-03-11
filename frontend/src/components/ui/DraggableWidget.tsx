'use client';

import React, { useState } from 'react';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface DraggableWidgetProps {
  id: string;
  label: string;
  index: number;
  visible: boolean;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  onToggleVisibility: (id: string) => void;
  children: React.ReactNode;
}

export function DraggableWidget({
  id,
  label,
  index,
  visible,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onToggleVisibility,
  children,
}: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!visible) return null;

  return (
    <div
      draggable
      onDragStart={() => {
        setIsDragging(true);
        onDragStart(index);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragEnter(index);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={() => {
        setIsDragging(false);
        setIsDragOver(false);
        onDragEnd();
      }}
      className={`
        relative group/drag transition-all duration-200
        ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
        ${isDragOver ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)] rounded-xl' : ''}
      `}
    >
      {/* Drag handle + visibility toggle overlay */}
      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-0 group-hover/drag:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(id);
          }}
          className="p-1 rounded-md bg-[var(--bg-card)] border border-[var(--border)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-colors"
          title={`Hide ${label}`}
        >
          <EyeOff className="w-3 h-3 text-[var(--text-muted)]" />
        </button>
      </div>
      <div className="absolute top-1/2 -left-3 -translate-y-1/2 z-10 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <div className="p-1 rounded-md bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
          <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
        </div>
      </div>
      {children}
    </div>
  );
}

// Widget settings panel for toggling visibility
interface WidgetSettingsProps {
  widgets: { id: string; label: string; visible: boolean }[];
  onToggle: (id: string) => void;
  onReset: () => void;
}

export function WidgetSettings({ widgets, onToggle, onReset }: WidgetSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
          bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        Widgets
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-primary)]">Toggle Widgets</span>
              <button onClick={onReset} className="text-[10px] text-[var(--accent)] hover:underline">
                Reset
              </button>
            </div>
            <div className="space-y-1">
              {widgets.map((w) => (
                <label key={w.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={w.visible}
                    onChange={() => onToggle(w.id)}
                    className="rounded border-[var(--border)] accent-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">{w.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-gain flex-shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-loss flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-gain/10 border-gain/20',
  error: 'bg-loss/10 border-loss/20',
  info: 'bg-[var(--accent)]/10 border-[var(--accent)]/20',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-up min-w-[280px] max-w-[420px] ${BG[t.type]}`}
          >
            {ICONS[t.type]}
            <p className="text-sm font-medium text-[var(--text-primary)] flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 rounded hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
            >
              <X className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
};

// Simple singleton event bus — no context needed
const listeners: ((t: ToastItem) => void)[] = [];

export function toast(message: string, type: ToastType = 'success', action?: { label: string; onClick: () => void }) {
  const item: ToastItem = { id: crypto.randomUUID?.() ?? `${Date.now()}`, message, type, action };
  listeners.forEach(fn => fn(item));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000);
    };
    listeners.push(handler);
    return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 md:bottom-6">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg text-sm font-medium text-white animate-in slide-in-from-bottom-2 ${t.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}
        >
          {t.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-none" />
            : <XCircle className="h-4 w-4 flex-none" />
          }
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action.onClick();
                setToasts(prev => prev.filter(x => x.id !== t.id));
              }}
              className="ml-2 flex-none rounded px-2 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 transition"
            >
              {t.action.label}
            </button>
          )}
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-1 opacity-70 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

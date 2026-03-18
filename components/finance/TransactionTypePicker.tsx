'use client';

// TransactionTypePicker
// A small bottom-sheet that lets the user pick Expense / Income / Transfer
// before the full add modal opens.

import { useEffect } from 'react';
import { Minus, Plus, ArrowLeftRight, X } from 'lucide-react';

type TxType = 'expense' | 'income' | 'transfer';

const TYPES: { type: TxType; label: string; icon: React.ElementType; bg: string; iconBg: string; text: string; border: string }[] = [
  { type: 'expense',  label: 'Expense',  icon: Minus,          bg: 'bg-rose-50',    iconBg: 'bg-rose-100',    text: 'text-rose-600',    border: 'border-rose-200'    },
  { type: 'income',   label: 'Income',   icon: Plus,           bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
  { type: 'transfer', label: 'Transfer', icon: ArrowLeftRight, bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-200'    },
];

interface Props {
  open: boolean;
  onSelect: (type: TxType) => void;
  onClose: () => void;
}

export default function TransactionTypePicker({ open, onSelect, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Transaction</h2>
            <p className="mt-0.5 text-xs text-gray-400">What kind of transaction?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Type cards */}
        <div className="grid grid-cols-3 gap-3">
          {TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => onSelect(t.type)}
                className={`flex flex-col items-center gap-2.5 rounded-xl border ${t.border} ${t.bg} px-2 py-4 transition hover:opacity-80 active:scale-95`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
                  <Icon className={`h-5 w-5 ${t.text}`} />
                </div>
                <span className={`text-xs font-semibold ${t.text}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

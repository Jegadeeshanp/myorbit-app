'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { Transaction } from '@/lib/financeData';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function TransactionSummaryCard({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { income, expense, invested, net } = useMemo(() => {
    let income = 0, expense = 0, invested = 0;
    transactions.forEach(tx => {
      if (tx.date > today) return; // upcoming — exclude from summary
      const d = new Date(tx.date);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      if (tx.type === 'income' && tx.category !== 'Transfer')  income  += tx.amount;
      if (tx.type === 'expense') {
        const abs = Math.abs(tx.amount);
        expense += abs;
        if (tx.category === 'Investment') invested += abs;
      }
    });
    return { income, expense, invested, net: income - expense };
  }, [transactions, today]);

  const metrics = [
    { label: 'Income',            value: income,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', Icon: TrendingUp },
    { label: 'Spent',             value: expense,  color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    Icon: TrendingDown },
    { label: 'Invested',          value: invested, color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100',  Icon: PiggyBank },
    { label: 'Available Balance', value: net,      color: net >= 0 ? 'text-blue-600' : 'text-rose-600', bg: 'bg-blue-50', border: 'border-blue-100', Icon: Wallet },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">This month · {monthLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} bg-white p-3.5 shadow-sm`}>
            <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.Icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className={`text-sm font-bold truncate ${m.color}`}>{fmt(m.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

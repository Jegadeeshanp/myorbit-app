'use client';

import { Transaction } from '@/lib/financeData';
import { useMemo } from 'react';

export default function SavingsRateCard({ transactions }: { transactions: Transaction[] }) {
  const { income, expense, rate } = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income  = thisMonth.filter(t => t.type === 'income' && t.category !== 'Transfer' && t.category !== 'Opening Balance').reduce((s,t) => s + t.amount, 0);
    const expense = thisMonth.filter(t => t.type === 'expense').reduce((s,t) => s + Math.abs(t.amount), 0);
    const rate    = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    return { income, expense, rate };
  }, [transactions]);

  const savings = Math.max(0, income - expense);

  const fmt = (v: number) => v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Savings Rate</h2>
          <p className="text-xs text-gray-400">This month</p>
        </div>
        <span className={`text-2xl font-bold ${rate >= 20 ? 'text-emerald-600' : rate >= 10 ? 'text-amber-500' : 'text-rose-500'}`}>
          {rate}%
        </span>
      </div>
      <div className="space-y-2.5">
        {[
          { label: 'Income',   value: income,   color: 'bg-emerald-500', pct: 100 },
          { label: 'Expenses', value: expense,  color: 'bg-rose-400',    pct: income > 0 ? Math.round((expense/income)*100) : 0 },
          { label: 'Savings',  value: savings,  color: 'bg-blue-500',    pct: rate },
        ].map(row => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900">{fmt(row.value)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${Math.min(row.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    const SYSTEM = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer'];
    const income  = thisMonth.filter(t => t.type === 'income'  && !SYSTEM.includes(t.category)).reduce((s,t) => s + t.amount, 0);
    const expense = thisMonth.filter(t => t.type === 'expense' && !SYSTEM.includes(t.category)).reduce((s,t) => s + Math.abs(t.amount), 0);
    const rate    = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    return { income, expense, rate };
  }, [transactions]);

  const savings = Math.max(0, income - expense);
  const fmt = (v: number) => v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const rateColor = rate >= 20 ? 'text-emerald-600 dark:text-[#00E5A0]' : rate >= 10 ? 'text-amber-500 dark:text-[#F9A44A]' : 'text-rose-500 dark:text-[#FF6B6B]';

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Savings Rate</h2>
          <p className="text-xs text-gray-400 dark:text-[#3d5166]">This month</p>
        </div>
        <span className={`text-2xl font-bold ${rateColor}`}>{rate}%</span>
      </div>
      <div className="space-y-2.5">
        {[
          { label: 'Income',   value: income,   color: '#00E5A0', pct: 100 },
          { label: 'Expenses', value: expense,  color: '#FF6B6B', pct: income > 0 ? Math.round((expense/income)*100) : 0 },
          { label: 'Savings',  value: savings,  color: '#5BE4FF', pct: rate },
        ].map(row => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-500 dark:text-[#8fa3b8]">{row.label}</span>
              <span className="font-medium text-gray-900 dark:text-[#e4eaf4]">{fmt(row.value)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06]">
              <div className="h-1.5 rounded-full" style={{ width: `${Math.min(row.pct, 100)}%`, backgroundColor: row.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

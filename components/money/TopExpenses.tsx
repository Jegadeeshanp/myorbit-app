'use client';

import { Transaction } from '@/lib/financeData';

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#eab308', '#8b5cf6'];

export default function TopExpenses({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter((tx) => tx.type === 'expense');

  const month = new Date().toLocaleString('default', { month: 'short' });

  const categories = expenses.reduce<Record<string, number>>((acc, tx) => {
    const key = tx.category || 'Other';
    acc[key] = (acc[key] ?? 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const rows = Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const max = Math.max(...rows.map((r) => r.amount), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Top expenses · {month}</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">This month</span>
      </div>

      <div className="mt-6 space-y-4">
        {rows.map((row, idx) => (
          <div key={row.category} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <div className="min-w-[90px] text-sm font-medium text-gray-700">{row.category}</div>
              <div className="flex-1 rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-emerald-500"
                  style={{ width: `${(row.amount / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-900">₹{row.amount.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

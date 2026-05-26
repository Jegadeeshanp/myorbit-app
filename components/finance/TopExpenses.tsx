'use client';

import { Transaction } from '@/lib/financeData';

const COLORS = ['#00E5A0', '#5BE4FF', '#F9A44A', '#A78BFA', '#818cf8'];

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
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Top Expenses · {month}</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#3d5166]">This month</span>
      </div>

      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.category}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="font-medium text-gray-700 dark:text-[#8fa3b8]">{row.category}</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">₹{row.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${(row.amount / max) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

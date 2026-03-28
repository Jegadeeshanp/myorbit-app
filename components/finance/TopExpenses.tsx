'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Transaction } from '@/lib/financeData';
import { getExcludedExpenseCategories } from '@/lib/customCategoryStore';

// System-internal categories that are never real expenses
const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment'];

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#eab308', '#8b5cf6'];

export default function TopExpenses({ transactions }: { transactions: Transaction[] }) {
  const now        = new Date();
  const curYear    = now.getFullYear();
  const curMonth   = now.getMonth();
  const monthLabel = now.toLocaleString('default', { month: 'short' });
  const excluded   = getExcludedExpenseCategories();

  // Only real expenses in the current calendar month
  const expenses = transactions.filter(tx => {
    if (tx.type !== 'expense') return false;
    if (SYSTEM_CATS.includes(tx.category)) return false;
    if (excluded.includes(tx.category)) return false;
    const d = new Date(tx.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });

  const categories = expenses.reduce<Record<string, number>>((acc, tx) => {
    const key = tx.category || 'Other';
    acc[key] = (acc[key] ?? 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const rows = Object.entries(categories)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const max = rows.length > 0 ? Math.max(...rows.map(r => r.amount), 1) : 1;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Top Expenses · {monthLabel}</h2>
          <p className="text-xs text-gray-400">Highest spend categories</p>
        </div>
        <Link
          href="/orbit/finance/transactions"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No expenses recorded this month</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.category} className="flex items-center gap-3">
              <div className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="w-24 flex-none truncate text-xs font-medium text-gray-700">{row.category}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${(row.amount / max) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                />
              </div>
              <span className="flex-none text-xs font-semibold text-gray-900">
                ₹{row.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

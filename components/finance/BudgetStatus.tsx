'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';

export default function BudgetStatus() {
  const { state } = useFinance();
  const { budgets } = state;
  const display = budgets.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Budget Status</h2>
          <p className="text-xs text-gray-400">Monthly spend vs limit</p>
        </div>
        <Link href="/orbit/finance/budget"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition">
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="space-y-3">
        {display.map(b => {
          const pct = Math.min(Math.round((b.spent / b.budget) * 100), 100);
          const over = b.spent > b.budget;
          const warn = pct >= 80;
          return (
            <div key={b.id}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">{b.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={over ? 'font-semibold text-rose-600' : warn ? 'font-semibold text-amber-500' : 'text-gray-500'}>
                    ₹{b.spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">₹{b.budget.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${over ? 'bg-rose-500' : warn ? 'bg-amber-400' : 'bg-emerald-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-0.5 text-right text-xs text-gray-400">{pct}% used</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

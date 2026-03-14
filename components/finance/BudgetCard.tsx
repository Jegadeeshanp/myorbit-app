'use client';

import { BudgetCategory } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function BudgetCard({ budget }: { budget: BudgetCategory }) {
  const { deleteBudget } = useFinance();

  // Fix: calculate raw % BEFORE clamping so we can use it for color logic
  const rawProgress  = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
  const isOver       = rawProgress > 100;
  const isWarning    = rawProgress >= 75 && !isOver;
  const displayWidth = Math.min(100, Math.round(rawProgress));

  const barColor  = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-gray-600';
  const remaining = budget.budget - budget.spent;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{budget.name}</h3>
          <p className="mt-0.5 text-xs text-gray-400">{fmt(budget.spent)} spent</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{fmt(budget.budget)}</p>
            <p className="text-xs text-gray-400">budget</p>
          </div>
          <button
            onClick={() => deleteBudget(budget.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400"
            title="Delete budget"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${displayWidth}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-semibold ${textColor}`}>
          {isOver ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget` : `${Math.round(rawProgress)}% used`}
        </span>
        {!isOver && (
          <span className="text-xs text-gray-400">{fmt(remaining)} left</span>
        )}
      </div>
    </div>
  );
}

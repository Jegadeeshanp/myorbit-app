'use client';

import BudgetCard from '@/components/finance/BudgetCard';
import { useFinance } from '@/lib/financeStore';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Budget</h1>
          <p className="mt-1 text-sm text-gray-600">
            Follow your monthly spending plan and stay on track.
          </p>
        </div>
        <button className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
          Adjust budget
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}

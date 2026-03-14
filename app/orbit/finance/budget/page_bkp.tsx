'use client';

import BudgetCard from '@/components/finance/BudgetCard';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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

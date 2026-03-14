'use client';

import Link from 'next/link';
import BudgetCard from '@/components/finance/BudgetCard';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <Link
            href="/orbit/finance/categories"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Categories
          </Link>
          <Link
            href="/orbit/finance/budget/add"
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Add budget
          </Link>
        </div>
      } />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} />
        ))}
      </div>
    </div>
  );
}
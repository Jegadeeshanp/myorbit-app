'use client';

import { useState } from 'react';
import Link from 'next/link';
import BudgetCard from '@/components/finance/BudgetCard';
import AddBudgetModal from '@/components/finance/AddBudgetModal';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { BudgetCategory } from '@/lib/financeData';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<BudgetCategory | null>(null);

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <Link
            href="/orbit/finance/categories"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            + Categories
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            + Add budget
          </button>
        </div>
      } />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onEdit={setEditTarget} />
        ))}
      </div>

      <AddBudgetModal open={isModalOpen} onClose={() => setModalOpen(false)} />
      <AddBudgetModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
      />
    </div>
  );
}

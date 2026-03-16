'use client';

import { useState } from 'react';
import BudgetCard from '@/components/finance/BudgetCard';
import AddBudgetModal from '@/components/finance/AddBudgetModal';
import CategoriesModal from '@/components/finance/CategoriesModal';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { BudgetCategory } from '@/lib/financeData';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<BudgetCategory | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            + <span className="hidden sm:inline">Categories</span><span className="sm:hidden">Cats</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-5 sm:py-2 sm:text-sm"
          >
            + <span className="hidden sm:inline">Add budget</span><span className="sm:hidden">Budget</span>
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
      <CategoriesModal open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  );
}

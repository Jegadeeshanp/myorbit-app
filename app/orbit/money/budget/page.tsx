'use client';

import { useState } from 'react';
import BudgetCard from '@/components/money/BudgetCard';
import AddBudgetModal from '@/components/money/AddBudgetModal';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/money/FinanceTopBar';
import { BudgetCategory } from '@/lib/financeData';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets } = state;
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<BudgetCategory | null>(null);

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          + Add budget
        </button>
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

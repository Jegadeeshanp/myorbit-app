'use client';

import { useState } from 'react';
import { Search, PlusCircle } from 'lucide-react';
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
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? budgets.filter(b => b.category?.toLowerCase().includes(search.toLowerCase()))
    : budgets;

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* Search (left) + Add Budget (right) */}
      <div className="flex items-center gap-3">
        {/* Search — icon only on mobile, full input on sm+ */}
        <button className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50">
          <Search className="h-4 w-4" />
        </button>
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search budgets…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <PlusCircle className="h-4 w-4" /> Add Budget
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((budget) => (
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

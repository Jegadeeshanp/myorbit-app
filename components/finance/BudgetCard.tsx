'use client';

import { useState } from 'react';
import { BudgetCategory } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { formatINR } from '@/lib/currency';
import { Trash2, Pencil } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function BudgetCard({ budget, onEdit }: { budget: BudgetCategory; onEdit?: (b: BudgetCategory) => void }) {
  const { deleteBudget } = useFinance();
  const [showConfirm, setShowConfirm] = useState(false);

  const rawProgress  = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
  const isOver       = rawProgress > 100;
  const isWarning    = rawProgress >= 75 && !isOver;
  const displayWidth = Math.min(100, Math.round(rawProgress));

  const barColor  = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = isOver ? 'text-rose-600 dark:text-[#FF6B6B]' : isWarning ? 'text-amber-600 dark:text-[#F9A44A]' : 'text-gray-600 dark:text-[#8fa3b8]';
  const remaining = budget.budget - budget.spent;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">{budget.name}</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-[#3d5166]">{formatINR(budget.spent)} spent</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#8fa3b8]">{formatINR(budget.budget)}</p>
            <p className="text-xs text-gray-400 dark:text-[#3d5166]">budget</p>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-[#3d5166] transition hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-500 dark:hover:text-[#8fa3b8]"
              title="Edit budget"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-[#3d5166] transition hover:bg-rose-50 dark:hover:bg-[#FF6B6B]/[0.1] hover:text-rose-400 dark:hover:text-[#FF6B6B]"
            title="Delete budget"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {budget.category && (
        <div className="mt-2 flex flex-wrap gap-1">
          {budget.category.split(',').map(c => c.trim()).filter(Boolean).map(c => (
            <span key={c} className="rounded-full bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-[#8fa3b8]">{c}</span>
          ))}
        </div>
      )}

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${displayWidth}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-semibold ${textColor}`}>
          {isOver ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget` : `${Math.round(rawProgress)}% used`}
        </span>
        {!isOver && (
          <span className="text-xs text-gray-400 dark:text-[#3d5166]">{formatINR(remaining)} left</span>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Delete budget category"
        description={`Are you sure you want to delete "${budget.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteBudget(budget.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

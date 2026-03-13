import { BudgetCategory } from '@/lib/financeData';

export default function BudgetCard({ budget }: { budget: BudgetCategory }) {
  const progress = Math.min(100, Math.round((budget.spent / budget.budget) * 100));
  const progressColor = progress > 100 ? 'bg-red-500' : 'bg-emerald-600';

  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{budget.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{budget.spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} spent</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">
            {budget.budget.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </div>
          <div className="text-xs text-gray-500">budget</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2 text-xs font-semibold text-gray-600">
        {progress}% used
      </div>
    </div>
  );
}

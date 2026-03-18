'use client';

import { Transaction } from '@/lib/financeData';

const BAR_COLORS = ['#10b981','#3b82f6','#f97316','#eab308','#8b5cf6'];

export default function SpendingCategories({ transactions }: { transactions: Transaction[] }) {
  const map = new Map<string, number>();
  transactions.filter(t => t.type === 'expense').forEach(t => {
    map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
  });
  const rows = Array.from(map.entries()).map(([cat, val]) => ({ cat, val })).sort((a,b) => b.val - a.val);
  const max = Math.max(...rows.map(r => r.val), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Spending by Category</h2>
        <p className="text-xs text-gray-400">All time expense breakdown</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-300">No expenses recorded yet</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.cat}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">{r.cat}</span>
                <span className="text-xs font-semibold text-gray-900">₹{r.val.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-2 rounded-full transition-all" style={{ width: `${(r.val/max)*100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

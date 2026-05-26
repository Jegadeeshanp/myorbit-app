'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Transaction } from '@/lib/financeData';

const BAR_COLORS = ['#00E5A0','#5BE4FF','#F9A44A','#A78BFA','#818cf8'];

export default function SpendingCategories({ transactions }: { transactions: Transaction[] }) {
  const map = new Map<string, number>();
  transactions.filter(t => t.type === 'expense').forEach(t => {
    map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
  });
  const rows = Array.from(map.entries())
    .map(([cat, val]) => ({ cat, val }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5);
  const max = Math.max(...rows.map(r => r.val), 1);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Spending by Category</h2>
          <p className="text-xs text-gray-400 dark:text-[#3d5166]">Top 5 expense categories</p>
        </div>
        <Link href="/orbit/finance/transactions"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-300 dark:text-[#3d5166] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-500 dark:hover:text-[#8fa3b8] transition">
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-300 dark:text-[#3d5166]">No expenses recorded yet</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.cat}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-[#8fa3b8]">{r.cat}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-[#e4eaf4]">₹{r.val.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                <div className="h-2 rounded-full transition-all" style={{ width: `${(r.val/max)*100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useFinance } from '@/lib/financeStore';
import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function UpcomingBills() {
  const { state } = useFinance();

  const bills = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return state.liabilities.map(l => {
      let due: Date;
      if (l.nextDueDate) {
        due = new Date(`${l.nextDueDate}T00:00:00`);
      } else {
        due = new Date(now.getFullYear(), now.getMonth(), 5);
        if (due <= now) due.setMonth(due.getMonth() + 1);
      }
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { name: l.name, amount: l.monthlyEmi, due: due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), daysLeft };
    }).filter(b => b.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [state.liabilities]);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Upcoming Bills</h2>
        <p className="text-xs text-gray-400 dark:text-[#3d5166]">Due in the next 30 days</p>
      </div>
      <div className="space-y-2">
        {bills.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400 dark:text-[#3d5166]">No upcoming bills</p>
        ) : bills.map((b, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-gray-50 dark:border-white/[0.04] py-2.5 last:border-0">
            <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${b.daysLeft <= 3 ? 'bg-rose-100 dark:bg-[#FF6B6B]/[0.12]' : 'bg-gray-100 dark:bg-white/[0.06]'}`}>
              <Calendar className={`h-4 w-4 ${b.daysLeft <= 3 ? 'text-rose-500 dark:text-[#FF6B6B]' : 'text-gray-400 dark:text-[#3d5166]'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-[#e4eaf4]">{b.name}</p>
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">Due {b.due}</p>
            </div>
            <div className="text-right flex-none">
              <p className={`text-sm font-bold ${b.daysLeft <= 3 ? 'text-rose-600 dark:text-[#FF6B6B]' : 'text-gray-900 dark:text-[#e4eaf4]'}`}>
                ₹{b.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

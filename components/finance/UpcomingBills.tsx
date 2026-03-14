'use client';

import { useFinance } from '@/lib/financeStore';
import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

export default function UpcomingBills() {
  const { state } = useFinance();

  const bills = useMemo(() => {
    return state.liabilities.map((l, i) => {
      const dueDay = 5 + i * 7;
      const now = new Date();
      const due = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (due < now) due.setMonth(due.getMonth() + 1);
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { name: l.name, amount: l.monthlyEmi, due: due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), daysLeft };
    }).sort((a,b) => a.daysLeft - b.daysLeft);
  }, [state.liabilities]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Upcoming Bills</h2>
        <p className="text-xs text-gray-400">EMIs and payments due soon</p>
      </div>
      <div className="space-y-3">
        {bills.map((b, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${b.daysLeft <= 3 ? 'bg-rose-100' : 'bg-gray-100'}`}>
                <Calendar className={`h-4 w-4 ${b.daysLeft <= 3 ? 'text-rose-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-400">Due {b.due}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">₹{b.amount.toLocaleString('en-IN')}</p>
              <p className={`text-xs ${b.daysLeft <= 3 ? 'text-rose-500 font-medium' : 'text-gray-400'}`}>
                {b.daysLeft}d left
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

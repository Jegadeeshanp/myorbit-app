'use client';

import {
  Coffee,
  CreditCard,
  FileText,
  Film,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Transaction } from '@/lib/financeData';

const iconMap: Record<string, React.ComponentType<any>> = {
  Food: Coffee,
  Transport: Truck,
  Shopping: ShoppingBag,
  Bills: FileText,
  Entertainment: Film,
  Default: CreditCard,
};

type RecentTransactionsProps = {
  transactions: Transaction[];
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Recent Transactions</h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#3d5166]">Latest</span>
      </div>

      <div className="space-y-3">
        {recent.map((tx) => {
          const Icon = iconMap[tx.category] ?? iconMap.Default;
          const isExpense = tx.type === 'expense';
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/[0.06]">
                  <Icon className="h-4 w-4 text-gray-600 dark:text-[#8fa3b8]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-[#e4eaf4]">{tx.category}</div>
                  <div className="text-xs text-gray-500 dark:text-[#3d5166]">{tx.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${isExpense ? 'text-rose-600 dark:text-[#FF6B6B]' : 'text-emerald-700 dark:text-[#00E5A0]'}`}>
                  {isExpense ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#3d5166]">{new Date(tx.date).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

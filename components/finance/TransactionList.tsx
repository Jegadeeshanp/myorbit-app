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

type TransactionListProps = {
  transactions: Transaction[];
};

export default function TransactionList({ transactions }: TransactionListProps) {
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
          <p className="mt-1 text-sm text-gray-600">All income and expenses recorded over time.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest first</span>
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((tx) => {
          const Icon = iconMap[tx.category] ?? iconMap.Default;
          const isExpense = tx.type === 'expense';
          return (
            <div key={tx.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{tx.category}</div>
                  <div className="text-xs text-gray-500">{tx.description}</div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-semibold ${isExpense ? 'text-red-600' : 'text-emerald-700'}`}>
                  {isExpense ? '-' : '+'}
                  ₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

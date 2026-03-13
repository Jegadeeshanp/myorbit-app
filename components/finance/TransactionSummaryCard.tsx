'use client';

import { Transaction } from '@/lib/financeData';

type TransactionSummaryCardProps = {
  transactions: Transaction[];
};

export default function TransactionSummaryCard({ transactions }: TransactionSummaryCardProps) {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });

  const totals = transactions.reduce(
    (acc, tx) => {
      const date = new Date(tx.date);
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return acc;
      if (tx.type === 'income') acc.income += tx.amount;
      if (tx.type === 'expense') acc.expense += Math.abs(tx.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const net = totals.income - totals.expense;

  const format = (value: number) =>
    value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-600">This month</div>
          <div className="mt-1 text-xs text-gray-500">{month}</div>
        </div>
        <div className="text-sm font-semibold text-gray-500">Summary</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Income</div>
          <div className="mt-2 text-xl font-semibold text-emerald-700">{format(totals.income)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Expense</div>
          <div className="mt-2 text-xl font-semibold text-red-600">{format(totals.expense)}</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net balance</div>
          <div
            className={`mt-2 text-xl font-semibold ${
              net >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {format(net)}
          </div>
        </div>
      </div>
    </div>
  );
}

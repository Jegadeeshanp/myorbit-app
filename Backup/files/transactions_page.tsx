'use client';

import Link from 'next/link';
import { useFinance } from '@/lib/financeStore';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <Link href="/orbit/finance/transactions/add?type=income"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            + Income
          </Link>
          <Link href="/orbit/finance/transactions/add"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            + Expense
          </Link>
        </div>
      } />
      <TransactionSummaryCard transactions={transactions} />
      <TransactionList transactions={transactions} />
    </div>
  );
}

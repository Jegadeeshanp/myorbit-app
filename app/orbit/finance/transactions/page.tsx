'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal from '@/components/finance/AddIncomeModal';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [isIncomeOpen,  setIncomeOpen]  = useState(false);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  return (
    <div className="space-y-5">
      <FinanceTopBar action={<div />} />

      <TransactionSummaryCard transactions={transactions} />
      
      {/* All Transactions Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">All Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>

      {/* Add Transaction Buttons */}
      <div className="flex gap-2 justify-center">
        <button type="button" onClick={() => setIncomeOpen(true)}
          className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
          + Income
        </button>
        <button type="button" onClick={() => setExpenseOpen(true)}
          className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          + Expense
        </button>
      </div>

      <AddIncomeModal
        open={isIncomeOpen}
        onClose={() => setIncomeOpen(false)}
        accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        onSave={addTransaction}
      />
      <AddExpenseModal
        open={isExpenseOpen}
        onClose={() => setExpenseOpen(false)}
        accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        onSave={addTransaction}
      />
    </div>
  );
}
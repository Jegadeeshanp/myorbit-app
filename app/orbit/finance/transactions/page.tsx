'use client';

import { useMemo, useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal from '@/components/finance/AddIncomeModal';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIncomeModalOpen] = useState(false);

  const totals = useMemo(() => {
    const now = new Date();
    const income = transactions
      .filter((tx) => {
        const date = new Date(tx.date);
        return tx.type === 'income' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = transactions
      .filter((tx) => {
        const date = new Date(tx.date);
        return tx.type === 'expense' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return { income, expense };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-600">All income and expenses recorded in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIncomeModalOpen(true)}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Add income
          </button>
          <button
            type="button"
            onClick={() => setExpenseModalOpen(true)}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Add expense
          </button>
        </div>
      </header>

      <TransactionSummaryCard transactions={transactions} />
      <TransactionList transactions={transactions} />

      <AddIncomeModal
        open={isIncomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        accounts={accounts.map((acct) => ({ id: acct.id, name: acct.name }))}
        onSave={(payload) => addTransaction(payload)}
      />

      <AddExpenseModal
        open={isExpenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        accounts={accounts.map((acct) => ({ id: acct.id, name: acct.name }))}
        onSave={(payload) => addTransaction(payload)}
      />
    </div>
  );
}

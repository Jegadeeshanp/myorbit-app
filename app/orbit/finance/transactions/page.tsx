'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <FinanceTopBar action={<div />} />

      <TransactionSummaryCard transactions={transactions} />

      {/* Search bar + Add buttons on same line */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button type="button" onClick={() => setIncomeOpen(true)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 whitespace-nowrap">
          + Income
        </button>
        <button type="button" onClick={() => setExpenseOpen(true)}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 whitespace-nowrap">
          + Expense
        </button>
      </div>

      {/* All Transactions Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">All Transactions</h2>
        <TransactionList transactions={filteredTransactions} />
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
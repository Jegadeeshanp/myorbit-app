'use client';

import { useState, useMemo } from 'react';
import { Search, CreditCard } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal from '@/components/finance/AddIncomeModal';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import TransactionFilterBar from '@/components/finance/TransactionFilterBar';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [isIncomeOpen,  setIncomeOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  // Handler for type change — resets account selection
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedAccountId('');
  };

  // Compute filtered transactions based on type and account
  const filteredTransactions = useMemo(() => {
    // First, filter by search query
    const searchFiltered = transactions.filter(t =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If no type/account filter is applied, return search-filtered results
    if (selectedType === 'All' && selectedAccountId === '') {
      return searchFiltered;
    }

    // Get account IDs matching the selected type
    const typeAccounts = accounts.filter(a =>
      selectedType === 'All' || a.type === selectedType
    );
    const typeAccountIds = new Set(typeAccounts.map(a => a.id));

    // Further narrow to specific account if selected
    const targetIds = selectedAccountId
      ? new Set([selectedAccountId])
      : typeAccountIds;

    // Filter transactions by account
    return searchFiltered.filter(t =>
      t.accountId && targetIds.has(t.accountId)
    );
  }, [transactions, accounts, selectedType, selectedAccountId, searchQuery]);

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

        {/* Show empty state if no transactions after filtering */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <TransactionFilterBar
                accounts={accounts}
                selectedType={selectedType}
                selectedAccountId={selectedAccountId}
                onTypeChange={handleTypeChange}
                onAccountChange={setSelectedAccountId}
              />
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 mb-3">
                <CreditCard className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery ? 'Try a different search term' : 'No transactions for this account'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <TransactionFilterBar
                accounts={accounts}
                selectedType={selectedType}
                selectedAccountId={selectedAccountId}
                onTypeChange={handleTypeChange}
                onAccountChange={setSelectedAccountId}
              />
            </div>
            <div>
              <TransactionList transactions={filteredTransactions} />
            </div>
          </div>
        )}
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
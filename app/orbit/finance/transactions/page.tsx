'use client';

import { useState, useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import TransactionList from '@/components/finance/TransactionList';
import TransactionFilterBar from '@/components/finance/TransactionFilterBar';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedType, setSelectedType]         = useState('All');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedAccountId('');
  };

  const filteredTransactions = useMemo(() => {
    if (selectedType === 'All' && !selectedAccountId) return transactions;

    const typeAccountIds = new Set(
      accounts
        .filter(a => selectedType === 'All' || a.type === selectedType)
        .map(a => a.id),
    );
    const targetIds = selectedAccountId
      ? new Set([selectedAccountId])
      : typeAccountIds;

    return transactions.filter(t => t.accountId && targetIds.has(t.accountId));
  }, [transactions, accounts, selectedType, selectedAccountId]);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const accountList = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* Account filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 overflow-hidden">
          <TransactionFilterBar
            accounts={accounts}
            selectedType={selectedType}
            selectedAccountId={selectedAccountId}
            onTypeChange={handleTypeChange}
            onAccountChange={setSelectedAccountId}
          />
        </div>
      </div>

      {filteredTransactions.length === 0 && (selectedType !== 'All' || selectedAccountId) ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-800 mb-3">
            <CreditCard className="h-5 w-5 text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-400">No transactions</p>
          <p className="text-xs text-gray-600 mt-1">No transactions for this account</p>
        </div>
      ) : (
        <TransactionList transactions={filteredTransactions} onAdd={() => setSheetOpen(true)} />
      )}

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        accounts={accountList}
        onSaveExpense={addTransaction}
        onSaveIncome={addTransaction}
        onSaveTransfer={(tx1, tx2) => { addTransaction(tx1); addTransaction(tx2); }}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';

export default function TransactionsPage() {
  const { state, addTransaction, addTransfer } = useFinance();
  const { transactions, accounts } = state;

  const [sheetOpen, setSheetOpen] = useState(false);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const accountList = accounts.map(a => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Transaction
        </button>
      } />

      <TransactionSummaryCard transactions={transactions} />
      <TransactionList transactions={transactions} />

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        accounts={accountList}
        onSaveExpense={addTransaction}
        onSaveIncome={addTransaction}
        onSaveTransfer={addTransfer}
      />
    </div>
  );
}

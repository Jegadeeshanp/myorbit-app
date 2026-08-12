'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [sheetOpen, setSheetOpen] = useState(false);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const accountList = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  return (
    <div className="space-y-5">
      <FinanceTopBar />
      <TransactionList transactions={transactions} onAdd={() => setSheetOpen(true)} />

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        accounts={accountList}
        onSaveExpense={addTransaction}
        onSaveIncome={addTransaction}
        onSaveTransfer={async (tx1, tx2) => { await addTransaction(tx1); await addTransaction(tx2); }}
      />
    </div>
  );
}

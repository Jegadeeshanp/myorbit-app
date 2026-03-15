'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal from '@/components/finance/AddIncomeModal';
import TransferModal from '@/components/finance/TransferModal';
import TransactionTypePicker from '@/components/finance/TransactionTypePicker';
import TransactionSummaryCard from '@/components/finance/TransactionSummaryCard';
import TransactionList from '@/components/finance/TransactionList';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { TransactionsSkeleton } from '@/components/finance/SkeletonLoader';
import { Plus } from 'lucide-react';

type ActiveModal = 'expense' | 'income' | 'transfer' | null;

export default function TransactionsPage() {
  const { state, addTransaction } = useFinance();
  const { transactions, accounts } = state;

  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  if (state.loadState === 'loading') return <TransactionsSkeleton />;

  const accountList = accounts.map(a => ({ id: a.id, name: a.name }));

  function openModal(type: 'expense' | 'income' | 'transfer') {
    setPickerOpen(false);
    setActiveModal(type);
  }

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Transaction
        </button>
      } />

      <TransactionSummaryCard transactions={transactions} />
      <TransactionList transactions={transactions} />

      {/* Type picker sheet */}
      <TransactionTypePicker
        open={pickerOpen}
        onSelect={openModal}
        onClose={() => setPickerOpen(false)}
      />

      {/* Add modals */}
      <AddExpenseModal
        open={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
        accounts={accountList}
        onSave={addTransaction}
      />
      <AddIncomeModal
        open={activeModal === 'income'}
        onClose={() => setActiveModal(null)}
        accounts={accountList}
        onSave={addTransaction}
      />
      <TransferModal
        open={activeModal === 'transfer'}
        onClose={() => setActiveModal(null)}
        accounts={accountList}
        onSave={(tx1, tx2) => { addTransaction(tx1); addTransaction(tx2); }}
      />
    </div>
  );
}

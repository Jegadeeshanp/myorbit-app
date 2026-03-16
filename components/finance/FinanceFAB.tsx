'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { useFinance } from '@/lib/financeStore';

export default function FinanceFAB() {
  const { state, addTransaction, addTransfer } = useFinance();
  const [open, setOpen] = useState(false);

  const accounts = state.accounts.map(a => ({ id: a.id, name: a.name }));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Fixed bottom-right FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-300/40 transition-all duration-200 hover:bg-emerald-700 active:scale-90 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddTransactionSheet
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        onSaveExpense={addTransaction}
        onSaveIncome={addTransaction}
        onSaveTransfer={(tx1, tx2) => addTransfer(tx1.accountId!, tx2.accountId!, Math.abs(tx1.amount), tx1.date, tx1.description)}
      />
    </>
  );
}

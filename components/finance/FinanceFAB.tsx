'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AddTransactionSheet from '@/components/finance/AddTransactionSheet';
import { useFinance } from '@/lib/financeStore';
import { useDraggableFab } from '@/lib/useDraggableFab';

export default function FinanceFAB() {
  const { state, addTransaction } = useFinance();
  const [open, setOpen] = useState(false);

  const accounts = state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  const { pos, dragging, hasMoved, pointerHandlers } = useDraggableFab('fab-position', { right: 20, bottom: 96 });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Fixed bottom-right FAB — draggable */}
      <button
        type="button"
        onClick={() => { if (!hasMoved.current) setOpen(true); }}
        aria-label="Add transaction"
        {...pointerHandlers}
        style={{ right: pos.right, bottom: pos.bottom }}
        className={`fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-300/40 transition-shadow duration-200 hover:bg-emerald-700 ${dragging ? 'cursor-grabbing scale-110' : 'cursor-grab active:scale-90'}`}
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddTransactionSheet
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        onSaveExpense={addTransaction}
        onSaveIncome={addTransaction}
        onSaveTransfer={(tx1, tx2) => { addTransaction(tx1); addTransaction(tx2); }}
      />
    </>
  );
}

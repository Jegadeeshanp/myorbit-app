'use client';

import { useState } from 'react';
import { Plus, Minus, ArrowLeftRight, TrendingUp } from 'lucide-react';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal  from '@/components/finance/AddIncomeModal';
import TransferModal   from '@/components/finance/TransferModal';
import AddAssetModal   from '@/components/finance/AddAssetModal';
import { useFinance }  from '@/lib/financeStore';

export default function QuickActions() {
  const { state, addTransaction, addAsset } = useFinance();
  const [expenseOpen,  setExpenseOpen]  = useState(false);
  const [incomeOpen,   setIncomeOpen]   = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [assetOpen,    setAssetOpen]    = useState(false);

  const accounts = state.accounts.map(a => ({ id: a.id, name: a.name }));

  // iconBg: a slightly lighter tint of the card bg for the icon wrapper —
  // visible in both light (using the accent color) and dark mode
  const ACTIONS = [
    { label: 'Add Expense', icon: Minus,          bg: 'bg-rose-50',    iconBg: 'bg-rose-100',    text: 'text-rose-600',    border: 'border-rose-100',    onClick: () => setExpenseOpen(true)  },
    { label: 'Add Income',  icon: Plus,           bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-100', onClick: () => setIncomeOpen(true)   },
    { label: 'Transfer',    icon: ArrowLeftRight, bg: 'bg-blue-50',    iconBg: 'bg-blue-100',    text: 'text-blue-600',    border: 'border-blue-100',    onClick: () => setTransferOpen(true) },
    { label: 'Add Asset',   icon: TrendingUp,     bg: 'bg-violet-50',  iconBg: 'bg-violet-100',  text: 'text-violet-600',  border: 'border-violet-100',  onClick: () => setAssetOpen(true)    },
  ];

  return (
    <>
      {/* Compact pill-row — no big card, just an inline strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mr-1 hidden sm:block">
          Quick add
        </span>
        {ACTIONS.map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`flex items-center gap-1.5 rounded-full border ${a.border} ${a.bg} px-3 py-1.5 text-xs font-semibold ${a.text} transition hover:opacity-80 active:scale-95`}
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </button>
        ))}
      </div>

      <AddExpenseModal  open={expenseOpen}  onClose={() => setExpenseOpen(false)}  accounts={accounts} onSave={addTransaction} />
      <AddIncomeModal   open={incomeOpen}   onClose={() => setIncomeOpen(false)}   accounts={accounts} onSave={addTransaction} />
      <TransferModal    open={transferOpen} onClose={() => setTransferOpen(false)} accounts={accounts}
        onSave={(tx1, tx2) => { addTransaction(tx1); addTransaction(tx2); }}
      />
      <AddAssetModal    open={assetOpen}    onClose={() => setAssetOpen(false)}    onSave={addAsset} />
    </>
  );
}

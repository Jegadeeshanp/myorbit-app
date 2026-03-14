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

  const ACTIONS = [
    { label: 'Add Expense', icon: Minus,          bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    onClick: () => setExpenseOpen(true)  },
    { label: 'Add Income',  icon: Plus,           bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', onClick: () => setIncomeOpen(true)   },
    { label: 'Transfer',    icon: ArrowLeftRight, bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    onClick: () => setTransferOpen(true) },
    { label: 'Add Asset',   icon: TrendingUp,     bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100',  onClick: () => setAssetOpen(true)    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`flex flex-col items-center gap-2 rounded-xl border ${a.border} ${a.bg} px-2 py-3 transition hover:opacity-80`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                <a.icon className={`h-4 w-4 ${a.text}`} />
              </div>
              <span className={`text-center text-xs font-medium ${a.text}`}>{a.label}</span>
            </button>
          ))}
        </div>
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

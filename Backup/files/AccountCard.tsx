'use client';

import { useState } from 'react';
import { Account, useFinance } from '@/lib/financeStore';
import { Landmark, CreditCard, Wallet, Banknote, Pencil, Check, X } from 'lucide-react';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

const TYPE_CONFIG: Record<Account['type'], { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Bank:          { icon: <Landmark className="h-4 w-4" />,   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  'Credit Card': { icon: <CreditCard className="h-4 w-4" />, color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-100' },
  'Debit Card':  { icon: <CreditCard className="h-4 w-4" />, color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-100' },
  Cash:          { icon: <Banknote className="h-4 w-4" />,   color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
  Wallet:        { icon: <Wallet className="h-4 w-4" />,     color: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-100' },
};

export default function AccountCard({ account }: { account: Account }) {
  const { addTransaction } = useFinance();
  const cfg = TYPE_CONFIG[account.type] ?? TYPE_CONFIG['Bank'];
  const isNegative = account.balance < 0;
  const isCredit = account.type === 'Credit Card';
  const creditLimit = isCredit ? Math.abs(account.balance) * 1.5 : 0;
  const utilization = isCredit && creditLimit > 0 ? Math.round((Math.abs(account.balance) / creditLimit) * 100) : 0;

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(account.balance));

  const handleSave = () => {
    const newBal = Number(inputVal);
    if (isNaN(newBal)) { setEditing(false); return; }
    const diff = newBal - account.balance;
    if (diff !== 0) {
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        category: 'Adjustment',
        description: `Balance adjustment — ${account.name}`,
        amount: diff,
        type: diff > 0 ? 'income' : 'expense',
        accountId: account.id,
      });
    }
    setEditing(false);
  };

  return (
    <div className={`group rounded-2xl border ${cfg.border} bg-white p-4 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl ${cfg.bg} ${cfg.color}`}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-400">{account.type}</p>
          </div>
        </div>

        {/* Balance + edit */}
        <div className="flex flex-none items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">₹</span>
              <input
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm font-bold focus:border-emerald-400 focus:outline-none"
              />
              <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className={`text-base font-bold ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
                {isNegative ? '-' : ''}{fmt(account.balance)}
              </p>
              <button
                onClick={() => { setInputVal(String(account.balance)); setEditing(true); }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credit utilization bar */}
      {isCredit && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-1.5 rounded-full ${utilization > 70 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(utilization,100)}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>Used {fmt(Math.abs(account.balance))}</span>
            <span className={utilization > 70 ? 'font-medium text-rose-500' : ''}>{utilization}% utilized</span>
          </div>
        </div>
      )}
    </div>
  );
}

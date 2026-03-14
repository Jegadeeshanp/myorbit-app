'use client';

import { useState } from 'react';
import { Account, useFinance } from '@/lib/financeStore';
import { Landmark, CreditCard, Wallet, Banknote, Pencil, Check, X } from 'lucide-react';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

const ACCOUNT_LABEL: Record<Account['type'], string> = {
  Bank:          'Savings Account',
  'Credit Card': 'Credit Card',
  'Debit Card':  'Debit Card',
  Cash:          'Cash',
  Wallet:        'Wallet',
};

const TYPE_CONFIG: Record<Account['type'], { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  Bank:          { icon: <Landmark className="h-4 w-4" />,   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  'Credit Card': { icon: <CreditCard className="h-4 w-4" />, color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100' },
  'Debit Card':  { icon: <CreditCard className="h-4 w-4" />, color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
  Cash:          { icon: <Banknote className="h-4 w-4" />,   color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  Wallet:        { icon: <Wallet className="h-4 w-4" />,     color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
};

function EditableBalance({ account }: { account: Account }) {
  const { addTransaction } = useFinance();
  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState(String(account.balance));
  const isNegative = account.balance < 0;

  const handleSave = () => {
    const newBal = Number(inputVal);
    if (!isNaN(newBal) && newBal !== account.balance) {
      const diff = newBal - account.balance;
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

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">₹</span>
        <input
          autoFocus
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm font-bold focus:border-emerald-400 focus:outline-none"
        />
        <button onClick={handleSave}      className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="group/bal flex items-center gap-1.5">
      <span className={`text-lg font-bold ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
        {isNegative ? '-' : ''}{fmt(account.balance)}
      </span>
      <button
        onClick={() => { setInputVal(String(account.balance)); setEditing(true); }}
        className="opacity-0 group-hover/bal:opacity-100 text-gray-300 hover:text-gray-500 transition"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ── Bank / Debit / Wallet / Cash card ── */
export function StandardCard({ account }: { account: Account }) {
  const cfg   = TYPE_CONFIG[account.type] ?? TYPE_CONFIG['Bank'];
  const label = ACCOUNT_LABEL[account.type];

  return (
    <div className={`group flex items-center justify-between gap-4 rounded-2xl border ${cfg.border} bg-white px-5 py-4 shadow-sm transition hover:shadow-md`}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${cfg.bg}`}>
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>

      {/* Right: balance */}
      <EditableBalance account={account} />
    </div>
  );
}

/* ── Credit Card card ── */
export function CreditCardCard({ account }: { account: Account }) {
  const outstanding = Math.abs(account.balance);
  const creditLimit = outstanding * 1.5;
  const available   = creditLimit - outstanding;
  const utilization = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
  const barColor    = utilization > 70 ? 'bg-rose-500' : utilization > 40 ? 'bg-amber-400' : 'bg-emerald-500';
  const utilColor   = utilization > 70 ? 'text-rose-500' : utilization > 40 ? 'text-amber-500' : 'text-emerald-600';

  return (
    <div className="group rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Top row — same structure as StandardCard */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50">
            <CreditCard className="h-4 w-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-400">Credit Card</p>
          </div>
        </div>
        <p className="flex-none text-lg font-bold text-rose-600">-{fmt(outstanding)}</p>
      </div>

      {/* Inline limit + utilization */}
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400">
        <span>Limit {fmt(creditLimit)}</span>
        <span className="text-gray-200">•</span>
        <span className={`font-semibold ${utilColor}`}>Used {utilization}%</span>
      </div>

      {/* Thin progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
      </div>

      {/* Available */}
      <p className="mt-1.5 text-xs text-gray-400">Available {fmt(available)}</p>
    </div>
  );
}

/* ── Default export (used by legacy references) ── */
export default function AccountCard({ account }: { account: Account }) {
  if (account.type === 'Credit Card') return <CreditCardCard account={account} />;
  return <StandardCard account={account} />;
}
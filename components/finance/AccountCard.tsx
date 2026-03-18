'use client';

import { useState } from 'react';
import { Account, useFinance } from '@/lib/financeStore';
import { Landmark, CreditCard, Wallet, Banknote, Pencil, Check, X, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  const { updateAccount } = useFinance();
  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState(String(account.balance));
  const isNegative = account.balance < 0;

  const handleSave = async () => {
    const newBal = Number(inputVal);
    if (!isNaN(newBal) && newBal !== account.balance) {
      await updateAccount({ ...account, balance: newBal });
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
        <button onClick={handleSave}           className="text-emerald-600 hover:text-emerald-700"><Check className="h-3.5 w-3.5" /></button>
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
        title="Edit balance"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function StandardCard({ account }: { account: Account }) {
  const { deleteAccount } = useFinance();
  const cfg   = TYPE_CONFIG[account.type] ?? TYPE_CONFIG['Bank'];
  const label = ACCOUNT_LABEL[account.type];
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className={`group flex items-center justify-between gap-3 rounded-2xl border ${cfg.border} bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${cfg.bg}`}>
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <EditableBalance account={account} />
        <button
          onClick={() => setShowConfirm(true)}
          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400"
          title="Delete account"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ConfirmDialog
        open={showConfirm}
        title="Delete account"
        description={`This will permanently delete "${account.name}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteAccount(account.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export function CreditCardCard({ account }: { account: Account }) {
  const { deleteAccount, updateAccount } = useFinance();
  const outstanding  = Math.abs(account.balance);
  const creditLimit  = account.creditLimit ?? outstanding * 1.5;
  const available    = Math.max(0, creditLimit - outstanding);
  const utilization  = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
  const barColor     = utilization > 70 ? 'bg-rose-500' : utilization > 40 ? 'bg-amber-400' : 'bg-emerald-500';
  const utilColor    = utilization > 70 ? 'text-rose-500' : utilization > 40 ? 'text-amber-500' : 'text-emerald-600';
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editBal,  setEditBal]        = useState('');
  const [editLimit, setEditLimit]     = useState('');

  const startEdit = () => {
    setEditBal(String(outstanding));
    setEditLimit(String(Math.round(creditLimit)));
    setEditing(true);
  };

  const saveEdit = async () => {
    const newBal   = Number(editBal);
    const newLimit = Number(editLimit);
    if (!isNaN(newBal) && !isNaN(newLimit)) {
      await updateAccount({ ...account, balance: -Math.abs(newBal), creditLimit: newLimit });
    }
    setEditing(false);
  };

  return (
    <div className="group rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-50">
            <CreditCard className="h-4 w-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-400">Credit Card</p>
          </div>
        </div>
        {!editing && (
          <div className="flex items-center gap-1.5">
            <p className="flex-none text-base font-bold text-rose-600">-{fmt(outstanding)}</p>
            <button onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
              title="Edit balance & limit">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowConfirm(true)}
              className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400"
              title="Delete account">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Outstanding balance (₹)</label>
            <input autoFocus value={editBal} onChange={e => setEditBal(e.target.value)} type="number" min="0"
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Credit limit (₹)</label>
            <input value={editLimit} onChange={e => setEditLimit(e.target.value)} type="number" min="0"
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveEdit}
              className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600">
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400">
            <span>Limit {fmt(creditLimit)}</span>
            <span className="text-gray-200">•</span>
            <span className={`font-semibold ${utilColor}`}>Used {utilization}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-400">Available {fmt(available)}</p>
        </>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Delete account"
        description={`This will permanently delete "${account.name}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteAccount(account.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

export default function AccountCard({ account }: { account: Account }) {
  if (account.type === 'Credit Card') return <CreditCardCard account={account} />;
  return <StandardCard account={account} />;
}

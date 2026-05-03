'use client';

import { useState, useRef, useEffect } from 'react';
import { Account, useFinance } from '@/lib/financeStore';
import { Landmark, CreditCard, Wallet, Banknote, Pencil, Check, X, Trash2, MoreHorizontal } from 'lucide-react';
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

function ActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        title="Options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[120px] rounded-xl border border-gray-100 bg-white shadow-lg">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-400" />
            Edit
          </button>
          <div className="mx-3 border-t border-gray-100" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-rose-500 hover:bg-rose-50 rounded-b-xl"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function EditAccountModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const { updateAccount } = useFinance();
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(String(account.balance));
  const [creditLimit, setCreditLimit] = useState(String(account.creditLimit ?? ''));
  const isCreditCard = account.type === 'Credit Card';

  const handleSave = async () => {
    const newBalance = Number(balance);
    const newCreditLimit = isCreditCard && creditLimit ? Number(creditLimit) : account.creditLimit;
    if (isNaN(newBalance)) return;
    await updateAccount({ ...account, name: name.trim() || account.name, balance: newBalance, ...(isCreditCard ? { creditLimit: newCreditLimit } : {}) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Edit Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Account Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              {isCreditCard ? 'Outstanding Balance' : 'Balance'}
            </label>
            <input
              value={balance}
              onChange={e => setBalance(e.target.value)}
              type="number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
          {isCreditCard && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Credit Limit</label>
              <input
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                type="number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white hover:bg-emerald-600">Save</button>
        </div>
      </div>
    </div>
  );
}

export function StandardCard({ account }: { account: Account }) {
  const { deleteAccount } = useFinance();
  const cfg   = TYPE_CONFIG[account.type] ?? TYPE_CONFIG['Bank'];
  const label = ACCOUNT_LABEL[account.type];
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const isNegative = account.balance < 0;

  return (
    <>
      <div className={`flex items-center justify-between gap-3 rounded-2xl border ${cfg.border} bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${cfg.bg}`}>
            <span className={cfg.color}>{cfg.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <span className={`text-lg font-bold ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
            {isNegative ? '-' : ''}{fmt(account.balance)}
          </span>
          <ActionsMenu onEdit={() => setShowEdit(true)} onDelete={() => setShowConfirm(true)} />
        </div>
      </div>

      {showEdit && <EditAccountModal account={account} onClose={() => setShowEdit(false)} />}
      <ConfirmDialog
        open={showConfirm}
        title="Delete account"
        description={`This will permanently delete "${account.name}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteAccount(account.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

export function CreditCardCard({ account }: { account: Account }) {
  const { deleteAccount } = useFinance();
  const outstanding  = Math.abs(account.balance);
  const creditLimit  = account.creditLimit ?? outstanding * 1.5;
  const available    = Math.max(0, creditLimit - outstanding);
  const utilization  = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
  const barColor     = utilization > 70 ? 'bg-rose-500' : utilization > 40 ? 'bg-amber-400' : 'bg-emerald-500';
  const utilColor    = utilization > 70 ? 'text-rose-500' : utilization > 40 ? 'text-amber-500' : 'text-emerald-600';
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:shadow-md">
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
          <div className="flex items-center gap-2">
            <p className="flex-none text-base font-bold text-rose-600">-{fmt(outstanding)}</p>
            <ActionsMenu onEdit={() => setShowEdit(true)} onDelete={() => setShowConfirm(true)} />
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-400">
          <span>Limit {fmt(creditLimit)}</span>
          <span className="text-gray-200">•</span>
          <span className={`font-semibold ${utilColor}`}>Used {utilization}%</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
        </div>

        <p className="mt-1.5 text-xs text-gray-400">Available {fmt(available)}</p>
      </div>

      {showEdit && <EditAccountModal account={account} onClose={() => setShowEdit(false)} />}
      <ConfirmDialog
        open={showConfirm}
        title="Delete account"
        description={`This will permanently delete "${account.name}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteAccount(account.id); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

export default function AccountCard({ account }: { account: Account }) {
  if (account.type === 'Credit Card') return <CreditCardCard account={account} />;
  return <StandardCard account={account} />;
}

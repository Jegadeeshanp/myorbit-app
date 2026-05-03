'use client';

import { useState, useMemo } from 'react';
import { Plus, Landmark } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import AccountCard from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import { AccountsSkeleton } from '@/components/finance/SkeletonLoader';

function fmt(v: number) {
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `₹${(abs / 100000).toFixed(2)}L`;
  return abs.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const { accounts, loadState } = state;
  const [addOpen, setAddOpen] = useState(false);

  const totalBalance  = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
  const totalAssets   = useMemo(() => accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0), [accounts]);
  const totalCredit   = useMemo(() => accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0), [accounts]);

  if (loadState === 'loading' || loadState === 'idle') return <AccountsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} linked</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Balance', value: fmt(totalBalance), color: totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-500' },
          { label: 'Total Assets',  value: fmt(totalAssets),  color: 'text-emerald-600' },
          { label: 'Outstanding',   value: fmt(totalCredit),  color: totalCredit > 0 ? 'text-rose-500' : 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm text-center">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Landmark className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">No accounts yet</p>
          <p className="mt-1 text-sm text-gray-500">Add a bank account, credit card, or wallet</p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <AddAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={addAccount}
      />
    </div>
  );
}

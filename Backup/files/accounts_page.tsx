'use client';

import { useMemo, useState } from 'react';
import { Landmark, CreditCard, Wallet, Banknote, TrendingDown, PlusCircle } from 'lucide-react';
import NetWorthCard from '@/components/finance/NetWorthCard';
import AccountCard from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { Account, useFinance } from '@/lib/financeStore';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

const SECTIONS: { key: string; title: string; icon: React.ElementType; types: Account['type'][] }[] = [
  { key: 'bank',   title: 'Bank Accounts',  icon: Landmark,    types: ['Bank'] },
  { key: 'credit', title: 'Credit Cards',   icon: CreditCard,  types: ['Credit Card'] },
  { key: 'debit',  title: 'Debit Cards',    icon: CreditCard,  types: ['Debit Card'] },
  { key: 'wallet', title: 'Wallets & Cash', icon: Wallet,      types: ['Cash', 'Wallet'] },
];

const METRIC_CONFIG = [
  { key: 'assets',      label: 'Assets',      icon: Landmark,     color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  { key: 'liabilities', label: 'Liabilities', icon: CreditCard,   color: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-100' },
  { key: 'liquid',      label: 'Liquid Cash', icon: Banknote,     color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
  { key: 'credit',      label: 'Credit Used', icon: TrendingDown, color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-100' },
];

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const metrics = useMemo(() => {
    let bank = 0, credit = 0, debit = 0, wallet = 0;
    state.accounts.forEach(a => {
      if (a.type === 'Credit Card') credit += a.balance;
      else if (a.type === 'Cash' || a.type === 'Wallet') wallet += a.balance;
      else if (a.type === 'Debit Card') debit += a.balance;
      else bank += a.balance;
    });
    const liquid = bank + wallet + debit;
    const liabilities = Math.abs(Math.min(credit, 0));
    return { assets: liquid, liabilities, liquid, credit: liabilities };
  }, [state.accounts]);

  const bySection = useMemo(() =>
    SECTIONS.reduce<Record<string, Account[]>>((acc, s) => {
      acc[s.key] = state.accounts.filter(a => s.types.includes(a.type));
      return acc;
    }, {}),
  [state.accounts]);

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <button type="button" onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4" /> Add account
        </button>
      } />

      {/* Net Worth card */}
      <NetWorthCard />

      {/* 4 metric tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METRIC_CONFIG.map(m => {
          const Icon = m.icon;
          const val = metrics[m.key as keyof typeof metrics];
          return (
            <div key={m.key} className={`flex items-center gap-3 rounded-2xl border ${m.border} bg-white p-3.5 shadow-sm`}>
              <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className={`text-sm font-bold truncate ${m.color}`}>{fmt(val)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account groups */}
      {SECTIONS.map(section => {
        const accounts = bySection[section.key] ?? [];
        if (!accounts.length) return null;
        const Icon = section.icon;
        return (
          <section key={section.key} id={`section-${section.key}`} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">{section.title}</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{accounts.length}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map(a => <AccountCard key={a.id} account={a} />)}
            </div>
          </section>
        );
      })}

      <AddAccountModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAccount} />
    </div>
  );
}

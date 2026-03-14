'use client';

import { useCallback, useMemo, useState } from 'react';
import { Landmark, CreditCard, Wallet, Banknote, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import AccountCard from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { Account, useFinance } from '@/lib/financeStore';

function fmt(value: number) {
  return Math.abs(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

const CATEGORY_SECTIONS: { key: string; title: string; icon: React.ReactNode; types: Account['type'][] }[] = [
  { key: 'bank',   title: 'Bank Accounts', icon: <Landmark className="h-4 w-4" />,   types: ['Bank'] },
  { key: 'credit', title: 'Credit Cards',  icon: <CreditCard className="h-4 w-4" />, types: ['Credit Card'] },
  { key: 'debit',  title: 'Debit Cards',   icon: <CreditCard className="h-4 w-4" />, types: ['Debit Card'] },
  { key: 'wallet', title: 'Wallets & Cash',icon: <Wallet className="h-4 w-4" />,     types: ['Cash', 'Wallet'] },
];

const SECTION_COLORS: Record<string, { tile: string; icon: string; value: string }> = {
  bank:   { tile: 'border-emerald-100 bg-emerald-50/60', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-700' },
  credit: { tile: 'border-rose-100 bg-rose-50/60',       icon: 'bg-rose-100 text-rose-600',       value: 'text-rose-600' },
  debit:  { tile: 'border-blue-100 bg-blue-50/60',       icon: 'bg-blue-100 text-blue-600',       value: 'text-blue-600' },
  wallet: { tile: 'border-amber-100 bg-amber-50/60',     icon: 'bg-amber-100 text-amber-600',     value: 'text-amber-600' },
};

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);

  const balances = useMemo(() => {
    let bank = 0, credit = 0, debit = 0, wallet = 0;
    state.accounts.forEach((a) => {
      if (a.type === 'Credit Card') credit += a.balance;
      else if (a.type === 'Cash' || a.type === 'Wallet') wallet += a.balance;
      else if (a.type === 'Debit Card') debit += a.balance;
      else bank += a.balance;
    });
    const assets = bank + wallet + debit;
    const liabilities = Math.abs(credit);
    const net = assets - liabilities;
    return { bank, credit, debit, wallet, assets, liabilities, net };
  }, [state.accounts]);

  const accountsBySection = useMemo(() => {
    return CATEGORY_SECTIONS.reduce<Record<string, Account[]>>((acc, section) => {
      acc[section.key] = state.accounts.filter((a) => section.types.includes(a.type));
      return acc;
    }, {} as Record<string, Account[]>);
  }, [state.accounts]);

  const handleScrollTo = useCallback((key: string) => {
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8">
      <FinanceTopBar action={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          <PlusCircle className="h-4 w-4" />
          Add account
        </button>
      } />

      {/* ── Premium Net Worth Card ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid divide-y divide-gray-100 lg:grid-cols-[1fr_1px_2fr] lg:divide-x lg:divide-y-0">

          {/* Left: Net Worth */}
          <div className="bg-[#F0F7F2] px-8 py-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Net Worth · ₹ INR</p>
            <p className={`mt-3 text-5xl font-bold tracking-tight ${balances.net < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {balances.net < 0 ? '-' : ''}{fmt(balances.net)}
            </p>
            <p className="mt-6 text-xs text-gray-400">{today}</p>
          </div>

          {/* Divider (lg only) */}
          <div className="hidden lg:block bg-gray-100" />

          {/* Right: 4 stat tiles */}
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
            {/* Assets */}
            <div className="flex flex-col justify-between px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Assets</p>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{fmt(balances.assets)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {state.accounts.filter(a => a.type !== 'Credit Card').length} accounts
                </p>
              </div>
            </div>

            {/* Liabilities */}
            <div className="flex flex-col justify-between px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Liabilities</p>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-rose-600">{fmt(balances.liabilities)}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {state.accounts.filter(a => a.type === 'Credit Card').length} active card{state.accounts.filter(a => a.type === 'Credit Card').length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Liquid Cash */}
            <div className="flex flex-col justify-between px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Banknote className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Liquid Cash</p>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{fmt(balances.bank + balances.wallet + balances.debit)}</p>
                <p className="mt-1 text-xs text-gray-400">Bank + wallets</p>
              </div>
            </div>

            {/* Credit used */}
            <div className="flex flex-col justify-between px-6 py-6">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <TrendingDown className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Credit Used</p>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-orange-600">{fmt(balances.liabilities)}</p>
                <p className="mt-1 text-xs text-gray-400">of available credit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-jump section tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORY_SECTIONS.map((section) => {
          const accounts = accountsBySection[section.key] ?? [];
          if (accounts.length === 0) return null;
          const colors = SECTION_COLORS[section.key];
          const total = accounts.reduce((s, a) => s + a.balance, 0);
          const isNeg = total < 0;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => handleScrollTo(section.key)}
              className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${colors.tile}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}>
                {section.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{section.title}</p>
                <p className={`mt-0.5 text-lg font-bold ${isNeg ? 'text-rose-600' : colors.value}`}>
                  {isNeg ? '-' : ''}{fmt(total)}
                </p>
                <p className="text-xs text-gray-400">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Account sections ── */}
      {CATEGORY_SECTIONS.map((section) => {
        const accounts = accountsBySection[section.key] ?? [];
        if (accounts.length === 0) return null;
        return (
          <section key={section.key} id={`section-${section.key}`} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md ${SECTION_COLORS[section.key].icon}`}>
                {section.icon}
              </div>
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
              <span className="text-sm text-gray-400">({accounts.length})</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </section>
        );
      })}

      <AddAccountModal
        open={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => addAccount(payload)}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Landmark, CreditCard, Wallet, Banknote, PlusCircle, TrendingDown, Search } from 'lucide-react';
import { StandardCard, CreditCardCard } from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { Account, useFinance } from '@/lib/financeStore';
import { AccountsSkeleton } from '@/components/finance/SkeletonLoader';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function SectionHeader({ icon: Icon, title, count, color }: { icon: React.ElementType; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{count}</span>
    </div>
  );
}

export default function AccountsPage() {
  const { state, addAccount } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { totalBalance, liquidBalance, creditUsed, totalExpenses, byType } = useMemo(() => {
    let bank = 0, credit = 0, wallet = 0, cash = 0, debit = 0;

    state.accounts.forEach(a => {
      if (a.type === 'Bank')        bank   += a.balance;
      if (a.type === 'Credit Card') credit += a.balance;
      if (a.type === 'Wallet')      wallet += a.balance;
      if (a.type === 'Cash')        cash   += a.balance;
      if (a.type === 'Debit Card')  debit  += a.balance;
    });

    const creditUsed    = Math.abs(Math.min(credit, 0));
    const liquidBalance = bank + wallet + cash + debit;
    const totalBalance  = liquidBalance - creditUsed;

    const now2 = new Date();
    const today2 = now2.toISOString().slice(0, 10);
    const SYSTEM = ['Opening Balance', 'Balance Adjustment', 'Adjustment', 'Credit Card Payment', 'Transfer'];
    const totalExpenses = state.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        if (SYSTEM.includes(t.category)) return false;
        if (t.date > today2) return false;
        const d = new Date(t.date);
        return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const byType: Record<Account['type'], Account[]> = {
      Bank:          [],
      'Credit Card': [],
      'Debit Card':  [],
      Cash:          [],
      Wallet:        [],
    };
    state.accounts.forEach(a => byType[a.type].push(a));

    return { totalBalance, liquidBalance, creditUsed, totalExpenses, byType };
  }, [state.accounts, state.transactions]);

  const metrics = [
    { label: 'Balance',     value: fmt(liquidBalance), icon: Landmark,     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', sub: 'Bank + Wallets + Cash' },
    { label: 'Credit Used', value: fmt(creditUsed),    icon: CreditCard,   color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    sub: 'Outstanding balance' },
    { label: 'Spent',       value: fmt(totalExpenses), icon: TrendingDown, color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100',  sub: 'This month' },
  ];

  const filteredByType = useMemo(() => {
    if (!search.trim()) return byType;
    const q = search.toLowerCase();
    const filtered: typeof byType = { Bank: [], 'Credit Card': [], 'Debit Card': [], Cash: [], Wallet: [] };
    (Object.keys(byType) as (keyof typeof byType)[]).forEach(k => {
      filtered[k] = byType[k].filter(a => a.name.toLowerCase().includes(q));
    });
    return filtered;
  }, [byType, search]);

  if (state.loadState === 'loading') return <AccountsSkeleton />;

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* Primary balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-7 py-6 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-white">Total Balance</p>
        <p className="mt-2 text-4xl font-bold text-white">{fmt(totalBalance)}</p>
        <p className="mt-1 text-xs text-white/80">Liquid assets minus credit used</p>
      </div>

      {/* 3 metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} bg-white px-4 py-3.5 shadow-sm`}>
            <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className={`text-base font-bold truncate ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-400">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none" />
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="inline-flex flex-none items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4" /> Add account
        </button>
      </div>

      {/* Bank Accounts */}
      {filteredByType['Bank'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Landmark} title="Bank Accounts" count={filteredByType['Bank'].length} color="text-emerald-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredByType['Bank'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* Credit Cards */}
      {filteredByType['Credit Card'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={CreditCard} title="Credit Cards" count={filteredByType['Credit Card'].length} color="text-rose-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredByType['Credit Card'].map(a => <CreditCardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* Debit Cards */}
      {filteredByType['Debit Card'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={CreditCard} title="Debit Cards" count={filteredByType['Debit Card'].length} color="text-blue-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredByType['Debit Card'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* Wallets */}
      {filteredByType['Wallet'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Wallet} title="Wallets" count={filteredByType['Wallet'].length} color="text-violet-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredByType['Wallet'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* Cash */}
      {filteredByType['Cash'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Banknote} title="Cash" count={filteredByType['Cash'].length} color="text-amber-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredByType['Cash'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      <AddAccountModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAccount} />
    </div>
  );
}

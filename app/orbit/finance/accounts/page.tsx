'use client';

import { useMemo, useState } from 'react';
import { Landmark, CreditCard, Wallet, Banknote, PlusCircle, TrendingDown, ArrowDownCircle } from 'lucide-react';
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

  if (state.loadState === 'loading') return <AccountsSkeleton />;

  const { totalBalance, creditUsed, totalExpenses, byType } = useMemo(() => {
    let bank = 0, credit = 0, wallet = 0, cash = 0, debit = 0;

    state.accounts.forEach(a => {
      if (a.type === 'Bank')        bank   += a.balance;
      if (a.type === 'Credit Card') credit += a.balance;
      if (a.type === 'Wallet')      wallet += a.balance;
      if (a.type === 'Cash')        cash   += a.balance;
      if (a.type === 'Debit Card')  debit  += a.balance;
    });

    // Total balance = bank + wallet + cash + debit (no credit cards)
    const totalBalance = bank + wallet + cash + debit;
    const creditUsed   = Math.abs(Math.min(credit, 0));

    // Total expenses from all transactions
    const totalExpenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const byType: Record<Account['type'], Account[]> = {
      Bank:          [],
      'Credit Card': [],
      'Debit Card':  [],
      Cash:          [],
      Wallet:        [],
    };
    state.accounts.forEach(a => byType[a.type].push(a));

    return { totalBalance, creditUsed, totalExpenses, byType };
  }, [state.accounts, state.transactions]);

  const metrics = [
    { label: 'Balance',     value: fmt(totalBalance), icon: Landmark,     color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', sub: 'Bank + Wallets + Cash' },
    { label: 'Credit Used', value: fmt(creditUsed),   icon: CreditCard,   color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    sub: 'Outstanding balance' },
    { label: 'Expenses',    value: fmt(totalExpenses), icon: TrendingDown, color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100',  sub: 'All time recorded' },
  ];

  return (
    <div className="space-y-6">
      <FinanceTopBar action={
        <button type="button" onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
          <PlusCircle className="h-4 w-4" /> Add account
        </button>
      } />

      {/* ── Primary balance card ── */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-emerald-700 px-7 py-6 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-white">Total Balance</p>
        <p className="mt-2 text-4xl font-bold text-white">{fmt(totalBalance)}</p>
      </div>

      {/* ── 3 metric cards ── */}
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

      {/* ── Bank Accounts ── */}
      {byType['Bank'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Landmark} title="Bank Accounts" count={byType['Bank'].length} color="text-emerald-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byType['Bank'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* ── Credit Cards ── */}
      {byType['Credit Card'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={CreditCard} title="Credit Cards" count={byType['Credit Card'].length} color="text-rose-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byType['Credit Card'].map(a => <CreditCardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* ── Debit Cards ── */}
      {byType['Debit Card'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={CreditCard} title="Debit Cards" count={byType['Debit Card'].length} color="text-blue-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byType['Debit Card'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* ── Wallets ── */}
      {byType['Wallet'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Wallet} title="Wallets" count={byType['Wallet'].length} color="text-violet-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byType['Wallet'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      {/* ── Cash ── */}
      {byType['Cash'].length > 0 && (
        <div className="space-y-2.5">
          <SectionHeader icon={Banknote} title="Cash" count={byType['Cash'].length} color="text-amber-600" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byType['Cash'].map(a => <StandardCard key={a.id} account={a} />)}
          </div>
        </div>
      )}

      <AddAccountModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAccount} />
    </div>
  );
}
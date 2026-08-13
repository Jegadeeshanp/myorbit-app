'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Landmark, CreditCard, Wallet, Banknote, PlusCircle, TrendingDown, Search, ShieldCheck, X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { StandardCard, CreditCardCard } from '@/components/finance/AccountCard';
import AddAccountModal from '@/components/finance/AddAccountModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { Account, useFinance } from '@/lib/financeStore';
import { AccountsSkeleton } from '@/components/finance/SkeletonLoader';
import Confetti from '@/components/Confetti';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function SectionHeader({ icon: Icon, title, count, color }: { icon: React.ElementType; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <Icon className={`h-4 w-4 ${color}`} />
      <h2 className="text-sm font-semibold text-gray-700 dark:text-[#e4eaf4]">{title}</h2>
      <span className="rounded-full bg-gray-100 dark:bg-white/[0.07] px-2 py-0.5 text-xs text-gray-500 dark:text-[#8fa3b8]">{count}</span>
    </div>
  );
}

// ── Reconcile modal ───────────────────────────────────────────────────────────

type Discrepancy = { account: Account; storedBalance: number; computedBalance: number; diff: number };

function ReconcileModal({
  discrepancies,
  onFix,
  onClose,
  fixing,
}: {
  discrepancies: Discrepancy[];
  onFix: () => void;
  onClose: () => void;
  fixing: boolean;
}) {
  const allMatch = discrepancies.length === 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#0e1420] shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#00E5A0]" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Reconcile Accounts</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-[#3d5166] hover:text-gray-600 dark:hover:text-[#8fa3b8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {allMatch ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">All balances match!</p>
              <p className="text-xs text-gray-500 dark:text-[#8fa3b8]">Your stored account balances are in sync with all transactions.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-none mt-0.5" />
                <p className="text-[12px] text-amber-700 dark:text-amber-300">
                  {discrepancies.length} account{discrepancies.length > 1 ? 's have' : ' has'} a balance mismatch. Fix will recompute balances from all transactions.
                </p>
              </div>
              <div className="space-y-2">
                {discrepancies.map(d => (
                  <div key={d.account.id} className="rounded-xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4] mb-1.5">{d.account.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <p className="text-gray-400 dark:text-[#3d5166]">Stored</p>
                        <p className="font-semibold text-gray-700 dark:text-[#8fa3b8]">{fmt(d.storedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-[#3d5166]">From transactions</p>
                        <p className="font-semibold text-emerald-700 dark:text-[#00E5A0]">{fmt(d.computedBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-[#3d5166]">Difference</p>
                        <p className={`font-bold ${d.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {d.diff > 0 ? '+' : ''}{fmt(d.diff)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 dark:border-white/[0.07] px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 dark:border-white/[0.1] py-2 text-sm font-medium text-gray-600 dark:text-[#8fa3b8] hover:bg-gray-50 dark:hover:bg-white/[0.06]">
            Close
          </button>
          {!allMatch && (
            <button onClick={onFix} disabled={fixing}
              className="flex-1 rounded-lg bg-emerald-500 dark:bg-[#00E5A0] py-2 text-sm font-semibold text-white dark:text-black hover:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-1.5">
              {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {fixing ? 'Fixing…' : 'Fix Balances'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { state, addAccount, fixAccountBalance } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const prevLenRef = useRef<number | null>(null);

  const [showReconcile, setShowReconcile] = useState(false);
  const [reconcileData, setReconcileData] = useState<Discrepancy[]>([]);
  const [reconcileFix, setReconcileFix] = useState(false);

  useEffect(() => {
    if (state.loadState !== 'ready') return;
    const len = state.accounts.length;
    if (prevLenRef.current === 0 && len === 1) setShowConfetti(true);
    prevLenRef.current = len;
  }, [state.accounts.length, state.loadState]);

  const { totalBalance, liquidBalance, creditUsed, totalExpenses, byType } = useMemo(() => {
    let bank = 0, creditUsed = 0, wallet = 0, cash = 0, debit = 0;

    state.accounts.forEach(a => {
      if (a.type === 'Bank')        bank       += a.balance;
      // Use Math.abs per card — balances may be stored positive or negative
      // depending on how they were entered; the card UI always shows outstanding as positive
      if (a.type === 'Credit Card') creditUsed += Math.abs(a.balance);
      if (a.type === 'Wallet')      wallet     += a.balance;
      if (a.type === 'Cash')        cash       += a.balance;
      if (a.type === 'Debit Card')  debit      += a.balance;
    });
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

  const handleReconcile = useCallback(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const discrepancies: Discrepancy[] = [];
    for (const account of state.accounts) {
      const computed = state.transactions
        .filter(t => t.accountId === account.id && t.date <= today)
        .reduce((s, t) => s + t.amount, 0);
      const diff = Math.round((computed - account.balance) * 100) / 100;
      if (Math.abs(diff) > 0.5) {
        discrepancies.push({ account, storedBalance: account.balance, computedBalance: computed, diff });
      }
    }
    setReconcileData(discrepancies);
    setShowReconcile(true);
  }, [state.accounts, state.transactions]);

  const handleFixBalances = useCallback(async () => {
    setReconcileFix(true);
    try {
      await Promise.all(reconcileData.map(d => fixAccountBalance(d.account.id)));
      setShowReconcile(false);
    } finally {
      setReconcileFix(false);
    }
  }, [reconcileData, fixAccountBalance]);

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
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <FinanceTopBar />

      {/* Primary balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-[#0a1f18] dark:to-[#0d2a20] border dark:border-[#00E5A0]/20 px-7 py-6 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70 dark:text-[#3d5166]">Total Balance</p>
        <p className="mt-2 text-4xl font-bold text-white dark:text-[#00E5A0]">{fmt(totalBalance)}</p>
        <p className="mt-1 text-xs text-white/80 dark:text-[#8fa3b8]">Liquid assets minus credit used</p>
      </div>

      {/* 3 metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] px-4 py-3.5 shadow-sm`}>
            <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">{m.label}</p>
              <p className={`text-base font-bold truncate ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Add + Reconcile */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-[#3d5166]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts…"
            className="w-full rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] py-2 pl-8 pr-4 text-sm text-gray-900 dark:text-[#e4eaf4] placeholder:text-gray-400 dark:placeholder:text-[#3d5166] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none" />
        </div>
        {state.accounts.length > 0 && (
          <button type="button" onClick={handleReconcile} title="Check that account balances match all transactions"
            className="inline-flex flex-none items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] px-3 py-2 text-sm font-medium text-gray-600 dark:text-[#8fa3b8] shadow-sm transition hover:border-emerald-400 dark:hover:border-[#00E5A0] hover:text-emerald-600 dark:hover:text-[#00E5A0]">
            <ShieldCheck className="h-4 w-4" /> Reconcile
          </button>
        )}
        <button type="button" onClick={() => setModalOpen(true)}
          className="inline-flex flex-none items-center gap-2 rounded-full bg-emerald-600 dark:bg-[#00E5A0] px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-emerald-700 dark:hover:bg-[#00c990]">
          <PlusCircle className="h-4 w-4" /> Add account
        </button>
      </div>

      {/* Empty state */}
      {!search && state.accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 dark:border-white/[0.1] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-[#00e5a0]/[0.1]">
            <Landmark className="h-8 w-8 text-emerald-500 dark:text-[#00E5A0]" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-[#e4eaf4]">No accounts yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#8fa3b8]">See exactly where your money goes</p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-[#3d5166]">Add a bank account, wallet, or cash to get started</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-[#00E5A0] px-5 py-2.5 text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-emerald-700 dark:hover:bg-[#00c990]"
          >
            <PlusCircle className="h-4 w-4" />
            Connect your first account
          </button>
        </div>
      )}

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
      {showReconcile && (
        <ReconcileModal
          discrepancies={reconcileData}
          onFix={handleFixBalances}
          onClose={() => setShowReconcile(false)}
          fixing={reconcileFix}
        />
      )}
    </div>
  );
}

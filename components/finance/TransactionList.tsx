'use client';

import { useState, useMemo } from 'react';
import {
  Coffee, CreditCard, FileText, Film, ShoppingBag,
  Truck, Search, Trash2, ChevronDown, TrendingUp,
  Landmark, Wallet, Banknote, ArrowLeftRight, Pencil,
  ArrowUpRight, ArrowDownLeft, Stethoscope, GraduationCap,
  Plane, MoreHorizontal,
  Home, ShoppingCart, Utensils, Fuel, Bus, Zap, Wifi,
  Smartphone, RefreshCw, Shield, Gift, Package, PiggyBank,
  Briefcase, Award, Laptop, Building2, Percent, RotateCcw, Undo2, Clock,
} from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import EmptyState from '@/components/finance/EmptyState';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal  from '@/components/finance/AddIncomeModal';
import ConfirmDialog   from '@/components/ConfirmDialog';
import { Transaction } from '@/lib/financeData';

// ── Category icon + color maps (expense categories) ───────────────────────
const EXPENSE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  // New expense categories
  Rent:          Home,
  Groceries:     ShoppingCart,
  Restaurants:   Utensils,
  Fuel:          Fuel,
  Transport:     Bus,
  Utilities:     Zap,
  Internet:      Wifi,
  Mobile:        Smartphone,
  Shopping:      ShoppingBag,
  Subscriptions: RefreshCw,
  Medical:       Stethoscope,
  Insurance:     Shield,
  Travel:        Plane,
  Education:     GraduationCap,
  Gifts:         Gift,
  Miscellaneous: Package,
  Investment:    PiggyBank,
  Loan:          Landmark,
  'Opening Balance':    TrendingUp,
  'Balance Adjustment': Wallet,
  // Legacy fallbacks
  Food:          Coffee,
  Bills:         FileText,
  Healthcare:    Stethoscope,
  Entertainment: Film,
  Others:        MoreHorizontal,
  Default:       CreditCard,
};

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  // Expense categories
  Rent:          { bg: 'bg-violet-100',  text: 'text-violet-700' },
  Groceries:     { bg: 'bg-green-100',   text: 'text-green-700' },
  Restaurants:   { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Fuel:          { bg: 'bg-amber-100',   text: 'text-amber-700' },
  Transport:     { bg: 'bg-blue-100',    text: 'text-blue-700' },
  Utilities:     { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  Internet:      { bg: 'bg-sky-100',     text: 'text-sky-700' },
  Mobile:        { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  Shopping:      { bg: 'bg-pink-100',    text: 'text-pink-700' },
  Subscriptions: { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  Medical:       { bg: 'bg-red-100',     text: 'text-red-700' },
  Insurance:     { bg: 'bg-teal-100',    text: 'text-teal-700' },
  Travel:        { bg: 'bg-sky-100',     text: 'text-sky-700' },
  Education:     { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  Gifts:         { bg: 'bg-rose-100',    text: 'text-rose-700' },
  Miscellaneous: { bg: 'bg-gray-100',    text: 'text-gray-600' },
  Investment:    { bg: 'bg-teal-100',    text: 'text-teal-700' },
  Loan:          { bg: 'bg-orange-100',  text: 'text-orange-700' },
  'Opening Balance':    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Balance Adjustment': { bg: 'bg-gray-100',    text: 'text-gray-600' },
  // Income categories
  Salary:        { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Bonus:         { bg: 'bg-green-100',   text: 'text-green-700' },
  Freelance:     { bg: 'bg-blue-100',    text: 'text-blue-700' },
  Business:      { bg: 'bg-violet-100',  text: 'text-violet-700' },
  Dividends:     { bg: 'bg-teal-100',    text: 'text-teal-700' },
  Interest:      { bg: 'bg-cyan-100',    text: 'text-cyan-700' },
  'Rental Income': { bg: 'bg-amber-100', text: 'text-amber-700' },
  Cashback:      { bg: 'bg-lime-100',    text: 'text-lime-700' },
  Refund:        { bg: 'bg-slate-100',   text: 'text-slate-600' },
  'Other Income': { bg: 'bg-gray-100',   text: 'text-gray-600' },
  // Legacy / misc
  Food:          { bg: 'bg-orange-100',  text: 'text-orange-700' },
  Bills:         { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  Entertainment: { bg: 'bg-pink-100',    text: 'text-pink-700' },
  Healthcare:    { bg: 'bg-red-100',     text: 'text-red-700' },
  Dividend:      { bg: 'bg-teal-100',    text: 'text-teal-700' },
  Transfer:      { bg: 'bg-blue-100',    text: 'text-blue-700' },
  Adjustment:    { bg: 'bg-gray-100',    text: 'text-gray-600' },
  Default:       { bg: 'bg-gray-100',    text: 'text-gray-600' },
};

// Returns the correct icon element + wrapper colours for a transaction row
function TxIcon({ tx }: { tx: { type: string; category: string } }) {
  if (tx.type === 'income') {
    return (
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-50">
        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
      </div>
    );
  }
  if (tx.category === 'Transfer') {
    return (
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-blue-50">
        <ArrowLeftRight className="h-4 w-4 text-blue-500" />
      </div>
    );
  }
  // expense — use category-specific color if available
  const Icon = EXPENSE_ICON_MAP[tx.category] ?? EXPENSE_ICON_MAP.Default;
  const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
  return (
    <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${catColor.bg}`}>
      <Icon className={`h-4 w-4 ${catColor.text}`} />
    </div>
  );
}

// ── Account type → tab key mapping ────────────────────────────────────────
const ACCOUNT_TYPE_TAB: Record<string, string> = {
  Bank:          'Bank',
  'Credit Card': 'Credit',
  'Debit Card':  'Debit',
  Wallet:        'Wallet',
  Cash:          'Cash',
};

// Tab config — icon + label + color
const TAB_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  All:    { icon: ArrowLeftRight, color: 'text-gray-600',    bg: 'bg-gray-100' },
  Income: { icon: TrendingUp,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Bank:   { icon: Landmark,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
  Credit: { icon: CreditCard,     color: 'text-rose-600',    bg: 'bg-rose-50' },
  Debit:  { icon: CreditCard,     color: 'text-blue-600',    bg: 'bg-blue-50' },
  Wallet: { icon: Wallet,         color: 'text-violet-600',  bg: 'bg-violet-50' },
  Cash:   { icon: Banknote,       color: 'text-amber-600',   bg: 'bg-amber-50' },
};


const SHORT_ACCOUNT_TYPE: Record<string, string> = {
  'Bank': 'Bank', 'Credit Card': 'Credit', 'Debit Card': 'Debit', 'Wallet': 'Wallet', 'Cash': 'Cash',
};
function accChip(account: { name: string; type: string }) {
  const short = SHORT_ACCOUNT_TYPE[account.type] ?? account.type;
  return account.name + ' · ' + short;
}
// ── Period options ─────────────────────────────────────────────────────────
const PERIODS = [
  { label: 'This Week',   value: 'week' },
  { label: 'This Month',  value: 'month' },
  { label: 'Last Month',  value: 'last_month' },
  { label: '3 Months',    value: '3m' },
  { label: '6 Months',    value: '6m' },
  { label: '1 Year',      value: '1y' },
] as const;
type PeriodValue = typeof PERIODS[number]['value'];

function filterByPeriod(txs: Transaction[], period: PeriodValue): Transaction[] {
  const now = new Date();
  return txs.filter(tx => {
    const d = new Date(tx.date);
    switch (period) {
      case 'week': {
        const ago = new Date(now); ago.setDate(now.getDate() - 7); return d >= ago;
      }
      case 'month':
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'last_month': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      case '3m': { const ago = new Date(now); ago.setMonth(now.getMonth() - 3);  return d >= ago; }
      case '6m': { const ago = new Date(now); ago.setMonth(now.getMonth() - 6);  return d >= ago; }
      case '1y': { const ago = new Date(now); ago.setFullYear(now.getFullYear() - 1); return d >= ago; }
      default: return true;
    }
  });
}

function groupByMonth(txs: Transaction[]) {
  const map = new Map<string, Transaction[]>();
  [...txs].sort((a, b) => b.date.localeCompare(a.date)).forEach(tx => {
    const key = new Date(tx.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  });
  return Array.from(map.entries()).map(([label, transactions]) => ({ label, transactions }));
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { state, deleteTransaction, updateTransaction } = useFinance();
  const [activeTab, setActiveTab]   = useState('All');
  const [period, setPeriod]         = useState<PeriodValue>('month');
  const [search, setSearch]         = useState('');
  const [dropdownOpen, setDropdown]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Transaction | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  // Today's date string for upcoming vs past split
  const today = new Date().toISOString().slice(0, 10);

  // Build account lookup: accountId → account type tab key
  const accountTabMap = useMemo(() => {
    const map = new Map<string, string>();
    state.accounts.forEach(a => {
      map.set(a.id, ACCOUNT_TYPE_TAB[a.type] ?? 'All');
    });
    return map;
  }, [state.accounts]);

  // Split into upcoming (future) and past
  const { pastTxs, upcomingTxs } = useMemo(() => ({
    pastTxs:     transactions.filter(tx => tx.date <= today),
    upcomingTxs: transactions.filter(tx => tx.date >  today),
  }), [transactions, today]);

  // Derive which tabs are available based on past transactions only
  const availableTabs = useMemo(() => {
    const tabs = new Set<string>(['All', 'Income']);
    pastTxs.forEach(tx => {
      if (tx.accountId) {
        const tab = accountTabMap.get(tx.accountId);
        if (tab) tabs.add(tab);
      }
    });
    return ['All', 'Income', 'Bank', 'Credit', 'Debit', 'Wallet', 'Cash']
      .filter(t => tabs.has(t));
  }, [pastTxs, accountTabMap]);

  // Ensure active tab stays valid
  const safeTab = availableTabs.includes(activeTab) ? activeTab : 'All';

  // Apply tab + search filter helper
  function applyTabSearch(txs: Transaction[]) {
    if (safeTab === 'Income') {
      txs = txs.filter(t => t.type === 'income');
    } else if (safeTab !== 'All') {
      txs = txs.filter(t => t.accountId && accountTabMap.get(t.accountId) === safeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return txs;
  }

  const filtered = useMemo(() => {
    return applyTabSearch(filterByPeriod(pastTxs, period));
  }, [pastTxs, period, safeTab, search, accountTabMap]);

  const filteredUpcoming = useMemo(() => {
    return applyTabSearch([...upcomingTxs].sort((a, b) => a.date.localeCompare(b.date)));
  }, [upcomingTxs, safeTab, search, accountTabMap]);

  const groups = useMemo(() => groupByMonth(filtered), [filtered]);

  const selectedPeriodLabel = PERIODS.find(p => p.value === period)?.label ?? 'This Month';

  // Summary uses past transactions only (excludes upcoming)
  const summary = useMemo(() => {
    const income  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expense, count: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-4">

      {/* ── Top controls: tabs + period dropdown + search ── */}
      <div className="space-y-3">

        {/* Tab row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {availableTabs.map(tab => {
              const cfg = TAB_CONFIG[tab];
              const Icon = cfg.icon;
              const isActive = safeTab === tab;
              // Count based on past transactions only (excludes upcoming)
              const periodPast = filterByPeriod(pastTxs, period);
              const count = tab === 'All'
                ? periodPast.length
                : tab === 'Income'
                ? periodPast.filter(t => t.type === 'income').length
                : periodPast.filter(t => t.accountId && accountTabMap.get(t.accountId) === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                  {tab}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Period dropdown */}
          <div className="relative flex-none">
            <button
              onClick={() => setDropdown(o => !o)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              {selectedPeriodLabel}
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setPeriod(p.value); setDropdown(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition hover:bg-gray-50 ${period === p.value ? 'text-emerald-600 bg-emerald-50/60' : 'text-gray-700'}`}
                  >
                    {p.label}
                    {period === p.value && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search + summary */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
          {summary.count > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="text-emerald-600 font-semibold">+₹{summary.income.toLocaleString('en-IN')}</span>
              <span className="text-rose-500 font-semibold">-₹{summary.expense.toLocaleString('en-IN')}</span>
              <span>{summary.count} txns</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming transactions ── */}
      {filteredUpcoming.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
          <div className="flex items-center gap-2 border-b border-blue-100 px-5 py-3">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-xs font-semibold text-blue-700">Upcoming</p>
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              {filteredUpcoming.length}
            </span>
          </div>
          <div className="divide-y divide-blue-50">
            {filteredUpcoming.map(tx => {
              const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
              const isExp    = tx.type === 'expense';
              const account  = tx.accountId ? state.accounts.find(a => a.id === tx.accountId) : null;
              return (
                <div key={tx.id} className="group flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-blue-50/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <TxIcon tx={tx} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{tx.description}</p>
                      <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                          {tx.category}
                        </span>
                        {account && (
                          <span className="rounded-full border border-gray-100 bg-white/70 px-2 py-0.5 text-xs text-gray-400">
                            {accChip(account)}
                          </span>
                        )}
                        <span className="text-xs text-blue-400">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <p className={`text-sm font-bold ${isExp ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => setEditTarget(tx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-300 opacity-0 transition group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-500"
                      title="Edit transaction"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmTarget(tx.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-blue-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transaction groups ── */}
      {groups.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions found"
          subtitle="Try a different tab, period, or search term"
        />
      ) : (
        groups.map(group => {
          const total = group.transactions.reduce(
            (s, tx) => tx.type === 'expense' ? s - Math.abs(tx.amount) : s + tx.amount, 0
          );
          return (
            <div key={group.label} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {/* Month header */}
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 px-5 py-3">
                <p className="text-xs font-semibold text-gray-700">{group.label}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{group.transactions.length} transactions</span>
                  <span className={`font-semibold ${total >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {total >= 0 ? '+' : ''}₹{Math.abs(total).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {group.transactions.map(tx => {
                  const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
                  const isExp    = tx.type === 'expense';
                  const account  = tx.accountId ? state.accounts.find(a => a.id === tx.accountId) : null;

                  return (
                    <div key={tx.id} className="group flex items-center justify-between gap-4 px-5 py-3 transition hover:bg-gray-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <TxIcon tx={tx} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{tx.description}</p>
                          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                              {tx.category}
                            </span>
                            {account && (
                              <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                                {accChip(account)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-none items-center gap-2">
                        <p className={`text-sm font-bold ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => setEditTarget(tx)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500"
                          title="Edit transaction"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmTarget(tx.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Edit modals */}
      {editTarget?.type === 'expense' && (
        <AddExpenseModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          accounts={state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }))}
          initial={editTarget}
          onSave={payload => { updateTransaction({ ...payload, id: editTarget.id }); setEditTarget(null); }}
        />
      )}
      {editTarget?.type === 'income' && (
        <AddIncomeModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          accounts={state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }))}
          initial={editTarget}
          onSave={payload => { updateTransaction({ ...payload, id: editTarget.id }); setEditTarget(null); }}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmTarget) deleteTransaction(confirmTarget); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
'use client';

import { useState, useMemo, useRef, useEffect, type CSSProperties } from 'react';
import {
  Coffee, CreditCard, FileText, Film, ShoppingBag,
  Truck, Search, Trash2, ChevronDown, ChevronRight, TrendingUp,
  Landmark, Wallet, Banknote, ArrowLeftRight, Pencil,
  ArrowUpRight, ArrowDownLeft, Stethoscope, GraduationCap,
  Plane, MoreHorizontal,
  Home, ShoppingCart, Utensils, Fuel, Bus, Zap, Wifi,
  Smartphone, RefreshCw, Shield, Gift, Package, PiggyBank,
  Briefcase, Award, Laptop, Building2, Percent, RotateCcw, Undo2, Clock,
  Plus,
} from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import EmptyState from '@/components/finance/EmptyState';
import AddExpenseModal from '@/components/finance/AddExpenseModal';
import AddIncomeModal  from '@/components/finance/AddIncomeModal';
import ConfirmDialog   from '@/components/ConfirmDialog';
import { Transaction } from '@/lib/financeData';
import { getExcludedExpenseCategories } from '@/lib/customCategoryStore';

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

// ── Dots menu per row (works for both mobile and desktop) ─────────────────
function TxDotsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (!(e.target as Element).closest('[data-tx-menu]')) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  function handleOpen() {
    if (!btnRef.current) { setOpen(v => !v); return; }
    const rect = btnRef.current.getBoundingClientRect();
    const style: CSSProperties = { position: 'fixed', zIndex: 9999, width: '128px', right: `${window.innerWidth - rect.right}px` };
    if (window.innerHeight - rect.bottom >= 80) style.top = `${rect.bottom + 4}px`;
    else style.bottom = `${window.innerHeight - rect.top + 4}px`;
    setMenuStyle(style);
    setOpen(v => !v);
  }
  return (
    <div className="flex-none">
      <button ref={btnRef} onClick={handleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div data-tx-menu style={menuStyle} className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg py-1">
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <Pencil className="h-3.5 w-3.5 text-gray-400 dark:text-gray-400" /> Edit
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TransactionList({ transactions, onAdd }: { transactions: Transaction[]; onAdd?: () => void }) {
  const { state, deleteTransaction, updateTransaction } = useFinance();
  const [activeTab, setActiveTab]   = useState('All');
  const [period, setPeriod]         = useState<PeriodValue>('month');
  const [search, setSearch]         = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [dropdownOpen, setDropdown]     = useState(false);
  const [editTarget, setEditTarget]       = useState<Transaction | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [upcomingOpen, setUpcomingOpen] = useState(true);

  // Today's date string for upcoming vs past split
  const today = new Date().toISOString().slice(0, 10);

  // Label for current month, to show "NOW" badge
  const currentMonthLabel = useMemo(
    () => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    []
  );

  function toggleGroup(label: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  // Abbreviate large numbers for group header (e.g. ₹2.1L, ₹94.8K)
  function fmtShort(v: number) {
    const abs = Math.abs(v);
    if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000)   return `₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000)     return `₹${(abs / 1000).toFixed(1)}K`;
    return `₹${abs.toLocaleString('en-IN')}`;
  }

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
      txs = txs.filter(t => {
        const account = t.accountId ? state.accounts.find(a => a.id === t.accountId) : null;
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q) ||
          String(Math.abs(t.amount)).includes(q) ||
          t.date.includes(q) ||
          (account?.name.toLowerCase().includes(q) ?? false) ||
          (account?.type.toLowerCase().includes(q) ?? false)
        );
      });
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

  const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment'];

  const summary = useMemo(() => {
    const excluded = getExcludedExpenseCategories();
    // Income card: real income only — exclude Opening Balance & Balance Adjustment
    const income = filtered.filter(t => t.type === 'income' && !SYSTEM_CATS.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    // Expense card: excludes Opening Balance, Balance Adjustment, and user-exempted categories from settings
    const expense = filtered.filter(t => t.type === 'expense' && !SYSTEM_CATS.includes(t.category) && !excluded.includes(t.category)).reduce((s, t) => s + Math.abs(t.amount), 0);
    // Net Balance: income minus expenses (excludes Opening Balance/Balance Adjustment, but includes user-exempted categories)
    const netExpense = filtered.filter(t => t.type === 'expense' && !SYSTEM_CATS.includes(t.category)).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expense, net: income - netExpense, count: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-4">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income',   value: summary.income,   positive: true,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ArrowUpRight },
          { label: 'Expenses', value: summary.expense,  positive: false, color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100',    icon: ArrowDownLeft },
          { label: 'Net Balance', value: summary.net, positive: summary.net >= 0,
            color: summary.net >= 0 ? 'text-emerald-600' : 'text-rose-600',
            bg:    summary.net >= 0 ? 'bg-emerald-50'    : 'bg-rose-50',
            border:summary.net >= 0 ? 'border-emerald-100' : 'border-rose-100',
            icon: TrendingUp },
        ].map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} bg-white p-4 shadow-sm`}>
            <div className={`hidden sm:flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-400">{m.label}</p>
              <p className={`truncate text-sm font-bold ${m.color}`}>
                {m.label === 'Net Balance' && m.value < 0 ? '-' : ''}₹{Math.abs(m.value).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Search (left) | Add + Filter (right) ── */}
      <div className="flex items-center gap-2">
        {/* Search — icon only on mobile, full input on sm+ */}
        {mobileSearch ? (
          <div className="relative flex flex-1 sm:hidden">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onBlur={() => { if (!search) setMobileSearch(false); }}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setMobileSearch(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Spacer pushes buttons to the right */}
        <div className="flex-1" />

        {/* Add button */}
        {onAdd && (
          <button onClick={onAdd}
            className="flex flex-none items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95">
            <Plus className="h-4 w-4" />
            Add transaction
          </button>
        )}
        {/* Filter / period dropdown */}
        <div className="relative flex-none">
          <button
            onClick={() => setDropdown(o => !o)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="inline text-xs">{selectedPeriodLabel}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setPeriod(p.value); setDropdown(false); }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 ${period === p.value ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/20' : 'text-gray-700 dark:text-gray-200'}`}
                >
                  {p.label}
                  {period === p.value && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {availableTabs.map(tab => {
          const cfg = TAB_CONFIG[tab];
          const Icon = cfg.icon;
          const isActive = safeTab === tab;
          const periodPast = filterByPeriod(pastTxs, period);
          const count = tab === 'All'
            ? periodPast.length
            : tab === 'Income'
            ? periodPast.filter(t => t.type === 'income').length
            : periodPast.filter(t => t.accountId && accountTabMap.get(t.accountId) === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}>
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {tab}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Upcoming transactions ── */}
      {filteredUpcoming.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm dark:border-blue-900/30 dark:bg-[#1C1F26]">
          {/* Collapsible header */}
          <button
            onClick={() => setUpcomingOpen(v => !v)}
            className="flex w-full items-center gap-2.5 border-b border-blue-100/60 bg-blue-50/70 px-5 py-3 text-left transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 active:bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
          >
            <ChevronRight className={`h-3.5 w-3.5 flex-none text-blue-400 transition-transform duration-150 ${upcomingOpen ? 'rotate-90' : ''}`} />
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Upcoming</p>
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              {filteredUpcoming.length}
            </span>
          </button>

          {upcomingOpen && (
            <div className="divide-y divide-blue-50/60 dark:divide-blue-900/20">
              {filteredUpcoming.map(tx => {
                const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
                const isExp    = tx.type === 'expense';
                const account  = tx.accountId ? state.accounts.find(a => a.id === tx.accountId) : null;
                const dateStr  = new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                return (
                  <div key={tx.id} className="group transition hover:bg-blue-50/60 focus-within:bg-blue-50/60 active:bg-blue-50/60 dark:hover:bg-blue-900/20 dark:focus-within:bg-blue-900/20 dark:active:bg-blue-900/20">
                    {/* Mobile */}
                    <div className="flex sm:hidden items-center gap-3 px-4 py-3">
                      <TxIcon tx={tx} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description}</p>
                        {tx.notes && <p className="truncate text-[11px] text-gray-400 leading-tight">{tx.notes}</p>}
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>{tx.category}</span>
                          {account && <span className="text-[11px] text-gray-400">{accChip(account)}</span>}
                          <span className="text-[11px] text-blue-400">{dateStr}</span>
                        </div>
                      </div>
                      <p className={`flex-none text-sm font-bold ${isExp ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </p>
                      <TxDotsMenu onEdit={() => setEditTarget(tx)} onDelete={() => setConfirmTarget(tx.id)} />
                    </div>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[90px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px_44px] items-start gap-x-3 px-5 py-3">
                      <span className="text-xs text-blue-400 whitespace-nowrap">{dateStr}</span>
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 min-w-0">{tx.description}</p>
                      <p className="truncate text-xs text-gray-400 min-w-0">{tx.notes || '—'}</p>
                      <span className={`inline-flex w-fit items-center justify-self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
                        {tx.category}
                      </span>
                      <span className="truncate text-xs text-gray-400">{account ? accChip(account) : '—'}</span>
                      <span className={`text-right text-sm font-bold ${isExp ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </span>
                      <div className="flex justify-end">
                        <TxDotsMenu onEdit={() => setEditTarget(tx)} onDelete={() => setConfirmTarget(tx.id)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Transaction table (single card, headers inside) ── */}
      {groups.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions found"
          subtitle="Try a different tab, period, or search term"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          {/* Column headers — desktop only */}
          <div className="hidden sm:grid grid-cols-[90px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px_44px] items-center gap-x-3 border-b border-gray-100 bg-transparent px-5 py-2.5">
            {['Date', 'Description', 'Notes', 'Category', 'Account', 'Amount', ''].map((h, i) => (
              <span key={i} className={`text-xs font-semibold uppercase tracking-wide text-gray-400 ${h === 'Amount' ? 'text-right' : ''}`}>{h}</span>
            ))}
          </div>

          {groups.map((group, gi) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const isNow       = group.label === currentMonthLabel;
            const groupNet    = group.transactions.reduce(
              (s, tx) => tx.type === 'expense' ? s - Math.abs(tx.amount) : s + tx.amount, 0
            );

            return (
            <div key={group.label}>

              {/* ── Month group header — clickable, collapsible ── */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition hover:bg-gray-50/60 dark:hover:bg-gray-800/30 ${gi > 0 ? 'border-t border-gray-100 dark:border-gray-700/40' : ''}`}
              >
                {/* Chevron */}
                <ChevronRight className={`h-3.5 w-3.5 flex-none text-gray-400 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`} />

                {/* Month name */}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{group.label}</span>

                {/* NOW badge */}
                {isNow && (
                  <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-100 leading-none">NOW</span>
                )}

                {/* Spacer */}
                <span className="flex-1" />

                {/* Entry count · net amount — right aligned */}
                <span className="text-xs text-gray-400">
                  {group.transactions.length} {group.transactions.length === 1 ? 'entry' : 'entries'}
                </span>
                <span className="text-gray-300 dark:text-gray-600 select-none">·</span>
                <span className={`text-xs font-semibold ${groupNet >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {groupNet >= 0 ? '+' : '-'}{fmtShort(groupNet)}
                </span>
              </button>

              {!isCollapsed && (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/40">
                {group.transactions.map(tx => {
                  const catColor = CAT_COLORS[tx.category] ?? CAT_COLORS.Default;
                  const isExp    = tx.type === 'expense';
                  const account  = tx.accountId ? state.accounts.find(a => a.id === tx.accountId) : null;
                  const dateStr  = new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                  return (
                    <div key={tx.id} className="group transition hover:bg-gray-50/50">
                      {/* Mobile layout */}
                      <div className="flex sm:hidden items-center gap-3 px-4 py-3">
                        <TxIcon tx={tx} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{tx.description}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>{tx.category}</span>
                            {account && <span className="text-[11px] text-gray-400">{accChip(account)}</span>}
                            <span className="text-[11px] text-gray-400">{dateStr}</span>
                          </div>
                        </div>
                        <p className={`flex-none text-sm font-bold ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </p>
                        <TxDotsMenu onEdit={() => setEditTarget(tx)} onDelete={() => setConfirmTarget(tx.id)} />
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden sm:grid grid-cols-[90px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px_44px] items-start gap-x-3 px-5 py-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{dateStr}</span>
                        <p className="truncate text-sm font-medium text-gray-900 min-w-0">{tx.description}</p>
                        <p className="truncate text-xs text-gray-400 min-w-0">{tx.notes || '—'}</p>
                        <span className="justify-self-start inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium truncate max-w-full">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${catColor.bg} ${catColor.text}`}>{tx.category}</span>
                        </span>
                        <span className="truncate text-xs text-gray-400">{account ? accChip(account) : '—'}</span>
                        <span className={`text-right text-sm font-bold ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExp ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <div className="flex justify-end">
                          <TxDotsMenu onEdit={() => setEditTarget(tx)} onDelete={() => setConfirmTarget(tx.id)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
            );
          })}
        </div>
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
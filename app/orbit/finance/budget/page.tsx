'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, PlusCircle, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import BudgetCard from '@/components/finance/BudgetCard';
import AddBudgetModal from '@/components/finance/AddBudgetModal';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { BudgetCategory } from '@/lib/financeData';

// ── helpers ───────────────────────────────────────────────────────────────────
function toYYYYMM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetPage() {
  const { state } = useFinance();
  const { transactions } = state;

  const currentMonth = toYYYYMM(new Date());
  const currentYear  = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Derive selected month/year numbers for the dropdowns
  const [selYear,  selMon] = selectedMonth.split('-').map(Number);

  const handleMonthChange = (month: number) => {
    const y = selYear;
    const m = String(month).padStart(2, '0');
    const next = `${y}-${m}`;
    setSelectedMonth(next > currentMonth ? currentMonth : next);
  };
  const handleYearChange = (year: number) => {
    const m = String(selMon).padStart(2, '0');
    const next = `${year}-${m}`;
    setSelectedMonth(next > currentMonth ? currentMonth : next);
  };
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<BudgetCategory | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [search, setSearch] = useState('');

  // For past months we fetch spent values directly from the API
  const [monthBudgets, setMonthBudgets] = useState<BudgetCategory[] | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const isPast = selectedMonth < currentMonth;

  const fetchMonthData = useCallback(async (month: string) => {
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}`);
      if (res.ok) setMonthBudgets(await res.json());
    } finally {
      setLoadingMonth(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth === currentMonth) {
      setMonthBudgets(null); // use store data for current month
    } else {
      fetchMonthData(selectedMonth);
    }
  }, [selectedMonth, currentMonth, fetchMonthData]);

  // Use fetched data for past months, store data for current month
  const budgets = monthBudgets ?? state.budgets;

  const filtered = search.trim()
    ? budgets.filter(b => b.category?.toLowerCase().includes(search.toLowerCase()))
    : budgets;

  // ── Summary figures ──────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const moneyIn = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income'
          && d.getMonth() + 1 === m
          && d.getFullYear() === y;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const planned = budgets.reduce((sum, b) => sum + (b.budget ?? 0), 0);
    return { moneyIn, planned, net: moneyIn - planned };
  }, [transactions, budgets, selectedMonth]);

  const netPositive = summary.net >= 0;

  const cards = [
    {
      label: 'Money In',
      sub: 'Total income',
      value: summary.moneyIn,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      icon: ArrowUpRight,
    },
    {
      label: 'Planned',
      sub: 'Total budget limit',
      value: summary.planned,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      icon: ArrowDownLeft,
    },
    {
      label: 'Net Balance',
      sub: netPositive ? 'Surplus' : 'Deficit',
      value: summary.net,
      color: netPositive ? 'text-emerald-600' : 'text-rose-600',
      bg: netPositive ? 'bg-emerald-50' : 'bg-rose-50',
      border: netPositive ? 'border-emerald-100' : 'border-rose-100',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <FinanceTopBar />

      {/* ── Month / Year selector ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] px-4 py-3 shadow-sm">
        {/* Month dropdown */}
        <select
          value={selMon}
          onChange={e => handleMonthChange(Number(e.target.value))}
          className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm font-semibold text-gray-800 dark:text-[#e4eaf4] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none cursor-pointer"
        >
          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((name, i) => {
            const mon = i + 1;
            const disabled = `${selYear}-${String(mon).padStart(2,'0')}` > currentMonth;
            return (
              <option key={mon} value={mon} disabled={disabled}>{name}</option>
            );
          })}
        </select>

        {/* Year dropdown */}
        <select
          value={selYear}
          onChange={e => handleYearChange(Number(e.target.value))}
          className="w-28 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-2 text-sm font-semibold text-gray-800 dark:text-[#e4eaf4] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none cursor-pointer"
        >
          {Array.from({ length: currentYear - 2022 }, (_, i) => currentYear - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {isPast && (
          <span className="hidden sm:inline-block shrink-0 rounded-full bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-gray-500 dark:text-[#3d5166]">
            Read-only
          </span>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`flex items-center gap-3 rounded-2xl border ${c.border} dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-4 shadow-sm`}>
            <div className={`hidden sm:flex h-9 w-9 flex-none items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-400 dark:text-[#3d5166]">{c.label}</p>
              <p className={`truncate text-sm font-bold ${c.color}`}>
                {c.label === 'Net Balance' && c.value < 0 ? '-' : ''}₹{Math.abs(c.value).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-[#3d5166]">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Add Budget */}
      <div className="flex items-center gap-2">
        {mobileSearch ? (
          <div className="flex sm:hidden flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setMobileSearch(false); }}
              placeholder="Search budgets…"
              className="w-full rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] py-2 pl-8 pr-4 text-sm text-gray-900 dark:text-[#e4eaf4] placeholder:text-gray-400 dark:placeholder:text-[#3d5166] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none" />
          </div>
        ) : (
          <button onClick={() => setMobileSearch(true)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-transparent shadow-sm text-gray-500 dark:text-[#8fa3b8] hover:bg-gray-50 dark:hover:bg-white/[0.06]">
            <Search className="h-4 w-4" />
          </button>
        )}
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search budgets…"
            className="w-full rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] py-2 pl-8 pr-4 text-sm text-gray-900 dark:text-[#e4eaf4] placeholder:text-gray-400 dark:placeholder:text-[#3d5166] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none"
          />
        </div>
        <div className="ml-auto">
          {!isPast && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 dark:bg-[#00E5A0] px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-emerald-800 dark:hover:bg-[#00c990]"
            >
              <PlusCircle className="h-4 w-4" /> Add Budget
            </button>
          )}
        </div>
      </div>

      {loadingMonth ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onEdit={isPast ? undefined : setEditTarget} />
          ))}
        </div>
      )}

      {!isPast && (
        <>
          <AddBudgetModal open={isModalOpen} onClose={() => setModalOpen(false)} />
          <AddBudgetModal
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            initial={editTarget ?? undefined}
          />
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Search, PlusCircle, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import BudgetCard from '@/components/finance/BudgetCard';
import AddBudgetModal from '@/components/finance/AddBudgetModal';
import { useFinance } from '@/lib/financeStore';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { BudgetCategory } from '@/lib/financeData';

export default function BudgetPage() {
  const { state } = useFinance();
  const { budgets, transactions } = state;
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<BudgetCategory | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? budgets.filter(b => b.category?.toLowerCase().includes(search.toLowerCase()))
    : budgets;

  // ── Summary figures ──────────────────────────────────────────────────────
  const SYSTEM_CATS = ['Opening Balance', 'Balance Adjustment'];

  const summary = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthPast = (t: { date: string }) => {
      const d = new Date(t.date);
      return t.date <= todayStr                      // exclude upcoming
        && d.getMonth() === now.getMonth()
        && d.getFullYear() === now.getFullYear();
    };

    // Inflow = income transactions this month (past only), excluding OB/BA
    const moneyIn = transactions
      .filter(t => t.type === 'income' && thisMonthPast(t) && !SYSTEM_CATS.includes(t.category))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Total planned = sum of all budget limits
    const planned = budgets.reduce((sum, b) => sum + (b.budget ?? 0), 0);

    // Net Balance = income - all expenses this month (past only)
    const totalExpense = transactions
      .filter(t => t.type === 'expense' && thisMonthPast(t))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { moneyIn, planned, net: moneyIn - totalExpense };
  }, [transactions, budgets]);

  const netPositive = summary.net >= 0;

  const cards = [
    {
      label: 'Inflow',
      sub: 'Income this month',
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
      sub: netPositive ? 'Income − Expenses' : 'Overspent',
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

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`flex items-center gap-3 rounded-2xl border ${c.border} bg-white p-4 shadow-sm`}>
            <div className={`hidden sm:flex h-9 w-9 flex-none items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-400">{c.label}</p>
              <p className={`truncate text-sm font-bold ${c.color}`}>
                {c.label === 'Net Balance' && c.value < 0 ? '-' : ''}₹{Math.abs(c.value).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400">{c.sub}</p>
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
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
        ) : (
          <button onClick={() => setMobileSearch(true)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50">
            <Search className="h-4 w-4" />
          </button>
        )}
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search budgets…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <PlusCircle className="h-4 w-4" /> Add Budget
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((budget) => (
          <BudgetCard key={budget.id} budget={budget} onEdit={setEditTarget} />
        ))}
      </div>

      <AddBudgetModal open={isModalOpen} onClose={() => setModalOpen(false)} />
      <AddBudgetModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
      />
    </div>
  );
}
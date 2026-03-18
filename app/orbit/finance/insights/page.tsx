'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import SmartInsights from '@/components/finance/SmartInsights';
import FinancialHealthScore from '@/components/finance/FinancialHealthScore';
import { useFinance } from '@/lib/financeStore';

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${Math.abs(v).toLocaleString('en-IN')}`;
}

export default function InsightsPage() {
  const { state } = useFinance();
  const txs = state.transactions;

  const today = new Date();
  const thisMonth = (t: { date: string; type: string }) => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && t.date <= today.toISOString().slice(0, 10);
  };
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = (t: { date: string; type: string }) => {
    const d = new Date(t.date);
    return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
  };

  const { savingsRate, thisIncome, thisExpense, lastExpense, expenseDelta, expenseDeltaPct, topCategories, insights } = useMemo(() => {
    const thisIncome  = txs.filter(t => thisMonth(t) && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const thisExpense = txs.filter(t => thisMonth(t) && t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const lastExpense = txs.filter(t => lastMonth(t) && t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = thisIncome > 0 ? Math.round(((thisIncome - thisExpense) / thisIncome) * 100) : 0;
    const expenseDelta = thisExpense - lastExpense;
    const expenseDeltaPct = lastExpense > 0 ? Math.round((expenseDelta / lastExpense) * 100) : 0;

    // Top spending categories this month
    const catMap = new Map<string, number>();
    txs.filter(t => thisMonth(t) && t.type === 'expense').forEach(t => {
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + Math.abs(t.amount));
    });
    const topCategories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({ cat, amount, pct: thisExpense > 0 ? Math.round((amount / thisExpense) * 100) : 0 }));

    // Auto-generated insight bullets
    const insights: { icon: React.ElementType; color: string; bg: string; text: string }[] = [];
    if (savingsRate >= 20) insights.push({ icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', text: `Great job! You're saving ${savingsRate}% of your income this month.` });
    else if (savingsRate > 0) insights.push({ icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50', text: `Savings rate is ${savingsRate}% — aim for 20%+ to build a strong safety net.` });
    else if (thisIncome > 0) insights.push({ icon: AlertCircle, color: 'text-rose-700', bg: 'bg-rose-50', text: `Spending exceeds income this month. Review your biggest expense categories.` });

    if (expenseDeltaPct > 15) insights.push({ icon: TrendingUp, color: 'text-rose-700', bg: 'bg-rose-50', text: `Spending is up ${expenseDeltaPct}% vs last month (+${fmt(expenseDelta)}).` });
    else if (expenseDeltaPct < -10) insights.push({ icon: TrendingDown, color: 'text-emerald-700', bg: 'bg-emerald-50', text: `Spending is down ${Math.abs(expenseDeltaPct)}% vs last month — well done!` });

    if (topCategories[0]) insights.push({ icon: Zap, color: 'text-violet-700', bg: 'bg-violet-50', text: `Top spend: ${topCategories[0].cat} at ${fmt(topCategories[0].amount)} (${topCategories[0].pct}% of total).` });

    return { savingsRate, thisIncome, thisExpense, lastExpense, expenseDelta, expenseDeltaPct, topCategories, insights };
  }, [txs]);

  const srColor = savingsRate >= 20 ? 'text-emerald-600' : savingsRate > 0 ? 'text-amber-600' : 'text-rose-600';
  const srBg    = savingsRate >= 20 ? 'bg-emerald-50'    : savingsRate > 0 ? 'bg-amber-50'    : 'bg-rose-50';

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* ── KPI row: Savings Rate + Expense Delta ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm`}>
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${srBg}`}>
            <PiggyBank className={`h-4 w-4 ${srColor}`} />
          </div>
          <p className="text-xs text-gray-400">Savings Rate</p>
          <p className={`text-xl font-bold ${srColor}`}>{savingsRate}%</p>
          <p className="text-[11px] text-gray-400">This month</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${expenseDelta <= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {expenseDelta <= 0 ? <TrendingDown className="h-4 w-4 text-emerald-600" /> : <TrendingUp className="h-4 w-4 text-rose-600" />}
          </div>
          <p className="text-xs text-gray-400">Expense Trend</p>
          <p className={`text-xl font-bold ${expenseDelta <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {expenseDeltaPct > 0 ? '+' : ''}{expenseDeltaPct}%
          </p>
          <p className="text-[11px] text-gray-400">vs last month</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-400">Income</p>
          <p className="text-xl font-bold text-blue-600">{fmt(thisIncome)}</p>
          <p className="text-[11px] text-gray-400">This month</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-xs text-gray-400">Expenses</p>
          <p className="text-xl font-bold text-orange-600">{fmt(thisExpense)}</p>
          <p className="text-[11px] text-gray-400">This month</p>
        </div>
      </div>

      {/* ── AI Insight bullets ── */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Key Insights</h2>
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${ins.bg}`}>
              <ins.icon className={`h-4 w-4 mt-0.5 flex-none ${ins.color}`} />
              <p className={`text-sm font-medium ${ins.color}`}>{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Top spending categories ── */}
      {topCategories.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Top Spending Categories</h2>
          <div className="space-y-3">
            {topCategories.map(({ cat, amount, pct }) => (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{fmt(amount)}</span>
                    <span className="w-8 text-right text-gray-400">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-rose-400 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FinancialHealthScore transactions={txs} />
      <SmartInsights transactions={txs} />
    </div>
  );
}

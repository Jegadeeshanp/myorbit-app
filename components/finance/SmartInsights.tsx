'use client';

import { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Transaction } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';

type Insight = { icon: React.ElementType; text: string; type: 'positive' | 'warning' | 'neutral' };

function getInsights(transactions: Transaction[], totalAssets: number, totalLiab: number): Insight[] {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const insights: Insight[] = [];

  // Category spending change
  const catThis: Record<string, number> = {};
  const catLast: Record<string, number> = {};
  thisMonth.filter(t => t.type === 'expense').forEach(t => { catThis[t.category] = (catThis[t.category] ?? 0) + Math.abs(t.amount); });
  lastMonth.filter(t => t.type === 'expense').forEach(t => { catLast[t.category] = (catLast[t.category] ?? 0) + Math.abs(t.amount); });

  Object.entries(catThis).forEach(([cat, amt]) => {
    const prev = catLast[cat] ?? 0;
    if (prev > 0) {
      const change = Math.round(((amt - prev) / prev) * 100);
      if (change > 20) insights.push({ icon: TrendingUp, text: `You spent ${change}% more on ${cat} this month.`, type: 'warning' });
      if (change < -15) insights.push({ icon: TrendingDown, text: `${cat} spending dropped by ${Math.abs(change)}% — great discipline!`, type: 'positive' });
    }
  });

  // Savings
  const thisIncome  = thisMonth.filter(t => t.type === 'income' && t.category !== 'Transfer').reduce((s,t) => s + t.amount, 0);
  const thisExpense = thisMonth.filter(t => t.type === 'expense').reduce((s,t) => s + Math.abs(t.amount), 0);
  const savingsRate = thisIncome > 0 ? Math.round(((thisIncome - thisExpense) / thisIncome) * 100) : 0;

  if (savingsRate > 30)  insights.push({ icon: CheckCircle2, text: `You are saving ${savingsRate}% of your income this month. Excellent!`, type: 'positive' });
  else if (savingsRate > 10) insights.push({ icon: Lightbulb, text: `Your savings rate is ${savingsRate}% this month. Try to push above 30%.`, type: 'neutral' });
  else if (thisIncome > 0)   insights.push({ icon: AlertCircle, text: `Your savings rate is only ${savingsRate}%. Consider cutting discretionary spending.`, type: 'warning' });

  // Only show net worth insight when there is actual data
  if (totalAssets > 0 || totalLiab > 0) {
    const debtRatio = totalAssets > 0 ? Math.round((totalLiab / totalAssets) * 100) : 0;
    if (debtRatio < 30) insights.push({ icon: TrendingUp, text: `Your debt-to-asset ratio is ${debtRatio}% — a healthy financial position.`, type: 'positive' });
    else if (debtRatio < 60) insights.push({ icon: Lightbulb, text: `Your debt is ${debtRatio}% of your assets. Focus on paying down liabilities.`, type: 'neutral' });
    else insights.push({ icon: AlertCircle, text: `Your debt is ${debtRatio}% of your assets. Prioritise reducing debt urgently.`, type: 'warning' });
  }

  return insights.slice(0, 4);
}

const TYPE_STYLE = {
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', text: 'text-emerald-800' },
  warning:  { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'text-amber-600',   text: 'text-amber-800' },
  neutral:  { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'text-blue-600',    text: 'text-blue-800' },
};

export default function SmartInsights({ transactions }: { transactions: Transaction[] }) {
  const { state } = useFinance();
  const insights = useMemo(
    () => getInsights(transactions, state.assets.reduce((s,a) => s + a.value, 0), state.liabilities.reduce((s,l) => s + l.outstanding, 0)),
    [transactions, state.assets, state.liabilities]
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-gray-900">Smart Insights</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">AI</span>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Lightbulb className="mb-2 h-8 w-8 text-gray-200" />
          <p className="text-sm text-gray-400">Add transactions and assets to get personalised insights.</p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {insights.map((ins, i) => {
            const s = TYPE_STYLE[ins.type];
            const Icon = ins.icon;
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border ${s.border} ${s.bg} p-3.5`}>
                <Icon className={`mt-0.5 h-4 w-4 flex-none ${s.icon}`} />
                <p className={`text-xs leading-relaxed ${s.text}`}>{ins.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
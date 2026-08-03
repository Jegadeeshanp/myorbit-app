'use client';

import { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getExcludedExpenseCategories, getExcludedIncomeCategories } from '@/lib/customCategoryStore';
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

  const excludedIncome  = getExcludedIncomeCategories();
  const excludedExpense = getExcludedExpenseCategories();
  const thisIncome  = thisMonth.filter(t => t.type === 'income'  && !excludedIncome.includes(t.category)).reduce((s,t) => s + t.amount, 0);
  const thisExpense = thisMonth.filter(t => t.type === 'expense' && !excludedExpense.includes(t.category)).reduce((s,t) => s + Math.abs(t.amount), 0);
  const savingsRate = thisIncome > 0 ? Math.round(((thisIncome - thisExpense) / thisIncome) * 100) : 0;

  if (savingsRate > 30)  insights.push({ icon: CheckCircle2, text: `You are saving ${savingsRate}% of your income this month. Excellent!`, type: 'positive' });
  else if (savingsRate > 10) insights.push({ icon: Lightbulb, text: `Your savings rate is ${savingsRate}% this month. Try to push above 30%.`, type: 'neutral' });
  else if (thisIncome > 0)   insights.push({ icon: AlertCircle, text: `Your savings rate is only ${savingsRate}%. Consider cutting discretionary spending.`, type: 'warning' });

  if (totalAssets > 0 || totalLiab > 0) {
    const debtRatio = totalAssets > 0 ? Math.round((totalLiab / totalAssets) * 100) : 0;
    if (debtRatio < 30) insights.push({ icon: TrendingUp, text: `Your debt-to-asset ratio is ${debtRatio}% — a healthy financial position.`, type: 'positive' });
    else if (debtRatio < 60) insights.push({ icon: Lightbulb, text: `Your debt is ${debtRatio}% of your assets. Focus on paying down liabilities.`, type: 'neutral' });
    else insights.push({ icon: AlertCircle, text: `Your debt is ${debtRatio}% of your assets. Prioritise reducing debt urgently.`, type: 'warning' });
  }

  return insights.slice(0, 4);
}

const TYPE_STYLE = {
  positive: {
    bg: 'bg-emerald-50 dark:bg-[#00e5a0]/[0.07]',
    border: 'border-emerald-100 dark:border-[#00e5a0]/[0.15]',
    icon: 'text-emerald-600 dark:text-[#00E5A0]',
    text: 'text-emerald-800 dark:text-[#8fa3b8]',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-[#F9A44A]/[0.07]',
    border: 'border-amber-100 dark:border-[#F9A44A]/[0.18]',
    icon: 'text-amber-600 dark:text-[#F9A44A]',
    text: 'text-amber-800 dark:text-[#8fa3b8]',
  },
  neutral: {
    bg: 'bg-blue-50 dark:bg-[#5BE4FF]/[0.07]',
    border: 'border-blue-100 dark:border-[#5BE4FF]/[0.15]',
    icon: 'text-blue-600 dark:text-[#5BE4FF]',
    text: 'text-blue-800 dark:text-[#8fa3b8]',
  },
};

export default function SmartInsights({ transactions }: { transactions: Transaction[] }) {
  const { state } = useFinance();
  const insights = useMemo(
    () => getInsights(transactions, state.assets.reduce((s,a) => s + a.value, 0), state.liabilities.reduce((s,l) => s + l.outstanding, 0)),
    [transactions, state.assets, state.liabilities]
  );

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-500 dark:text-[#F9A44A]" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Smart Insights</h2>
        <span className="rounded-full bg-amber-100 dark:bg-[#F9A44A]/[0.15] px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-[#F9A44A]">AI</span>
      </div>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Lightbulb className="mb-2 h-8 w-8 text-gray-200 dark:text-white/[0.08]" />
          <p className="text-sm text-gray-400 dark:text-[#3d5166]">Add transactions and assets to get personalised insights.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
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

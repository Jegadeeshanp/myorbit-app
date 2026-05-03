'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Landmark } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import NetWorthCard from '@/components/finance/NetWorthCard';
import SummaryCard from '@/components/finance/SummaryCard';
import RecentTransactions from '@/components/finance/RecentTransactions';
import SpendingCategories from '@/components/finance/SpendingCategories';
import QuickActions from '@/components/finance/QuickActions';
import { DashboardSkeleton } from '@/components/finance/SkeletonLoader';

function fmt(v: number) {
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000)     return `₹${(abs / 1000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

export default function FinanceOverviewPage() {
  const { state } = useFinance();
  const { transactions, accounts, loadState } = state;

  const thisMonth = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.date?.startsWith(month));
  }, [transactions]);

  const totalIncome  = useMemo(() => thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [thisMonth]);
  const totalExpense = useMemo(() => Math.abs(thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)), [thisMonth]);
  const savings      = totalIncome - totalExpense;
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  if (loadState === 'loading' || loadState === 'idle') {
    return <DashboardSkeleton />;
  }

  if (loadState === 'error') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Failed to load finance data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <QuickActions />

      <NetWorthCard />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          title="Income this month"
          value={fmt(totalIncome)}
          subtitle={`${thisMonth.filter(t => t.type === 'income').length} transactions`}
          Icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          valueClassName="text-emerald-600"
        />
        <SummaryCard
          title="Expenses this month"
          value={fmt(totalExpense)}
          subtitle={`${thisMonth.filter(t => t.type === 'expense').length} transactions`}
          Icon={TrendingDown}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          valueClassName="text-rose-500"
        />
        <SummaryCard
          title="Savings this month"
          value={fmt(savings)}
          subtitle={totalIncome > 0 ? `${Math.round((savings / totalIncome) * 100)}% savings rate` : 'No income yet'}
          Icon={PiggyBank}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          valueClassName={savings >= 0 ? 'text-blue-600' : 'text-rose-500'}
        />
        <SummaryCard
          title="Total balance"
          value={fmt(totalBalance)}
          subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          Icon={Landmark}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecentTransactions transactions={transactions} />
        <SpendingCategories transactions={transactions} />
      </div>
    </div>
  );
}

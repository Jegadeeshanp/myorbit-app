'use client';

import { useMemo } from 'react';
import { Wallet, CreditCard, Landmark, ChevronRight } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
import { formatINR } from '@/lib/currency';
import Link from 'next/link';
import FinanceTopBar from '@/components/finance/FinanceTopBar';

import NetWorthCard        from '@/components/finance/NetWorthCard';
import SummaryCard         from '@/components/finance/SummaryCard';
import CashFlowChart       from '@/components/finance/CashFlowChart';
import AssetAllocationChart from '@/components/finance/AssetAllocationChart';
import SpendingCategories  from '@/components/finance/SpendingCategories';
import NetWorthTrend       from '@/components/finance/NetWorthTrend';
import RecentTransactions  from '@/components/finance/RecentTransactions';
import TopExpenses         from '@/components/finance/TopExpenses';
import SavingsRateCard     from '@/components/finance/SavingsRateCard';
import BudgetStatus        from '@/components/finance/BudgetStatus';
import UpcomingBills       from '@/components/finance/UpcomingBills';
import SmartInsights       from '@/components/finance/SmartInsights';
import FinancialHealthScore from '@/components/finance/FinancialHealthScore';
import { DashboardSkeleton } from '@/components/finance/SkeletonLoader';

function getLastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
  });
}

export default function FinanceOverviewPage() {
  const { state } = useFinance();
  const { accounts, transactions } = state;

  // Show skeleton while data is loading on first visit
  if (state.loadState === 'loading') return <DashboardSkeleton />;

  const availableBalance = useMemo(() =>
    accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + a.balance, 0),
  [accounts]);

  const creditUsed = useMemo(() =>
    Math.abs(accounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + Math.min(0, a.balance), 0)),
  [accounts]);



  const totalAssets = useMemo(() =>
    state.assets.reduce((s, a) => s + a.value, 0),
  [state.assets]);

  const totalLiabilities = useMemo(() =>
    state.liabilities.reduce((s, l) => s + l.outstanding, 0),
  [state.liabilities]);

  const monthData = useMemo(() => {
    const months = getLastMonths(6);
    const map = new Map(months.map(m => [`${m.year}-${m.month}`, { month: m.label, income: 0, expense: 0 }]));
    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const row = map.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (!row) return;
      if (tx.type === 'income')  row.income  += tx.amount;
      if (tx.type === 'expense') row.expense += Math.abs(tx.amount);
    });
    return Array.from(map.values());
  }, [transactions]);

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* Net Worth */}
      <NetWorthCard />

      {/* 3 Metric cards — clickable */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/orbit/finance/assets"
          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">Assets</p>
            <p className="text-xl font-bold text-emerald-600 truncate">{formatINR(totalAssets)}</p>
            <p className="text-xs text-gray-400">{state.assets.length} assets tracked</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-gray-300" />
        </Link>

        <Link href="/orbit/finance/liabilities"
          className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-rose-200 hover:-translate-y-0.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50">
            <CreditCard className="h-5 w-5 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">Liabilities</p>
            <p className="text-xl font-bold text-rose-600 truncate">{formatINR(totalLiabilities)}</p>
            <p className="text-xs text-gray-400">{state.liabilities.length} active loans</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-gray-300" />
        </Link>

        <Link href="/orbit/finance/accounts"
          className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-50">
            <Landmark className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400">Account Balance</p>
            <p className="text-xl font-bold text-emerald-600 truncate">{formatINR(availableBalance)}</p>
            <p className="text-xs text-gray-400">Bank, wallets &amp; cash</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-gray-300" />
        </Link>
      </div>

      {/* Health + Insights */}
      <div className="grid gap-5 lg:grid-cols-2">
        <FinancialHealthScore transactions={transactions} />
        <SmartInsights transactions={transactions} />
      </div>

      {/* Cash Flow */}
      <CashFlowChart data={monthData} />

      {/* Asset Allocation + Spending */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AssetAllocationChart />
        <SpendingCategories transactions={transactions} />
      </div>

      {/* Net Worth Trend */}
      <NetWorthTrend />

      {/* Recent Transactions + Top Expenses */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} />
        </div>
        <TopExpenses transactions={transactions} />
      </div>

      {/* Budget Status + Savings Rate + Upcoming Bills */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SavingsRateCard transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <BudgetStatus />
        </div>
        <div className="lg:col-span-1">
          <UpcomingBills />
        </div>
      </div>
    </div>
  );
}
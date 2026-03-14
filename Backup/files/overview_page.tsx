'use client';

import { useMemo } from 'react';
import { Wallet, CreditCard, TrendingDown } from 'lucide-react';
import { useFinance } from '@/lib/financeStore';
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
import QuickActions        from '@/components/finance/QuickActions';
import SmartInsights       from '@/components/finance/SmartInsights';
import FinancialHealthScore from '@/components/finance/FinancialHealthScore';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

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

  const availableBalance = useMemo(() =>
    accounts.filter(a => a.type !== 'Credit Card').reduce((s, a) => s + a.balance, 0),
  [accounts]);

  const creditUsed = useMemo(() =>
    Math.abs(accounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + Math.min(0, a.balance), 0)),
  [accounts]);

  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentYear  = useMemo(() => new Date().getFullYear(), []);

  const spentThisMonth = useMemo(() =>
    Math.abs(transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear).reduce((s, t) => s + t.amount, 0)),
  [transactions, currentMonth, currentYear]);

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
      <p className="text-sm text-gray-500">Your personal money command center — manage and control finances with clarity.</p>

      {/* Net Worth */}
      <NetWorthCard />

      {/* 3 Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Available Balance"
          value={fmt(availableBalance)}
          subtitle={`Across ${accounts.length} accounts`}
          Icon={Wallet}
          valueClassName="text-emerald-600"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SummaryCard
          title="Credit Used"
          value={fmt(creditUsed)}
          subtitle="Outstanding balance"
          Icon={CreditCard}
          valueClassName="text-orange-500"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <SummaryCard
          title="Spent This Month"
          value={fmt(spentThisMonth)}
          subtitle={new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          Icon={TrendingDown}
          valueClassName="text-rose-500"
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
        />
      </div>

      {/* Quick actions */}
      <QuickActions />

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

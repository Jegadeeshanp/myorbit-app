'use client';

import { useMemo } from 'react';
import { Wallet, CreditCard, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '@/lib/financeStore';
import RecentTransactions from '@/components/finance/RecentTransactions';
import TopExpenses from '@/components/finance/TopExpenses';
import NetWorthCard from '@/components/finance/NetWorthCard';
import SummaryCard from '@/components/finance/SummaryCard';
import MonthlyTrendChart from '@/components/finance/MonthlyTrendChart';

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

const COLORS = ['#10b981', '#3b82f6', '#f97316', '#eab308', '#8b5cf6'];

function monthName(date: Date) {
  return date.toLocaleString('default', { month: 'short' });
}

function getLastMonths(count: number) {
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: date.getFullYear(), month: date.getMonth(), label: monthName(date) });
  }
  return months;
}

export default function FinanceOverviewPage() {
  const { state } = useFinance();
  const { accounts, transactions } = state;

  const availableBalance = useMemo(() => {
    return accounts
      .filter((a) => a.type !== 'Credit Card')
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const creditUsed = useMemo(() => {
    return Math.abs(
      accounts
        .filter((a) => a.type === 'Credit Card')
        .reduce((sum, a) => sum + Math.min(0, a.balance), 0)
    );
  }, [accounts]);

  const currentMonth = useMemo(() => new Date().getMonth(), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const spentThisMonth = useMemo(() => {
    return Math.abs(
      transactions
        .filter((t) => t.type === 'expense')
        .filter((t) => {
          const date = new Date(t.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0)
    );
  }, [transactions, currentMonth, currentYear]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = map.get(t.category) ?? 0;
        map.set(t.category, current + Math.abs(t.amount));
      });
    return Array.from(map.entries()).map(([category, value]) => ({ category, value }));
  }, [transactions]);

  const monthData = useMemo(() => {
    const months = getLastMonths(6);
    const monthMap = new Map<string, { month: string; income: number; expense: number }>();

    months.forEach((m) => {
      monthMap.set(`${m.year}-${m.month}`, { month: m.label, income: 0, expense: 0 });
    });

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const row = monthMap.get(key);
      if (!row) return;
      if (tx.type === 'income') row.income += tx.amount;
      if (tx.type === 'expense') row.expense += Math.abs(tx.amount);
    });

    return Array.from(monthMap.values());
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <NetWorthCard />
        </div>

        <div className="lg:col-span-1">
          <SummaryCard
            title="Available balance"
            value={formatCurrency(availableBalance)}
            subtitle={`Across ${accounts.length} accounts`}
            Icon={Wallet}
            valueClassName="text-emerald-600"
          />
        </div>

        <div className="lg:col-span-1">
          <SummaryCard
            title="Credit used"
            value={formatCurrency(creditUsed)}
            subtitle="of your credit limit"
            Icon={CreditCard}
            valueClassName="text-orange-500"
          />
        </div>

        <div className="lg:col-span-1">
          <SummaryCard
            title="Spent this month"
            value={formatCurrency(spentThisMonth)}
            subtitle={new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
            Icon={TrendingDown}
            valueClassName="text-red-500"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MonthlyTrendChart data={monthData} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition">
            <h2 className="text-sm font-semibold text-gray-900">Monthly expense breakdown</h2>
            <p className="mt-1 text-xs text-gray-500">See how spending distributes across categories.</p>

            <div className="mt-4 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="category"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${Math.round((percent ?? 0) * 100)}%)`}
                  >
                    {expenseByCategory.map((entry, idx) => (
                      <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <TopExpenses transactions={transactions} />
        </div>
      </div>
    </div>
  );
}

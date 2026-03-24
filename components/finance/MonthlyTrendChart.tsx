'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

type MonthData = {
  month: string;
  income: number;
  expense: number;
};

type Props = {
  data: MonthData[];
};

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0;
  const expense = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="mt-2 space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Income</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Expense</span>
          <span className="font-semibold text-red-500">{formatCurrency(expense)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyTrendChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Monthly Trend</h2>
        <p className="mt-1 text-xs text-gray-500">Income vs spending, last 6 months</p>
      </div>

      <div className="mt-4 h-[180px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
            <YAxis tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} tick={{ fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={24} />
            <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

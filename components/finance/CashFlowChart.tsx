'use client';

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type MonthRow = { month: string; income: number; expense: number };

function fmt(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

export default function CashFlowChart({ data }: { data: MonthRow[] }) {
  const enriched = data.map(d => ({ ...d, savings: Math.max(0, d.income - d.expense) }));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cash Flow</h2>
          <p className="text-xs text-gray-400">Last 6 months income vs expenses</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />Income</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-rose-400" />Expense</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />Savings</span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enriched} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Bar dataKey="income"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
            <Line dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

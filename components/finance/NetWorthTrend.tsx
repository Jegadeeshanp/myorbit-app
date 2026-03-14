'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useFinance } from '@/lib/financeStore';
import { useMemo } from 'react';

function fmt(v: number) {
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  return `₹${(v/1000).toFixed(0)}K`;
}

function getLastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
  });
}

export default function NetWorthTrend() {
  const { state } = useFinance();

  const data = useMemo(() => {
    const totalAssets = state.assets.reduce((s,a) => s + a.value, 0);
    const totalLiab   = state.liabilities.reduce((s,l) => s + l.outstanding, 0);
    const base        = totalAssets - totalLiab;
    // Simulate 6-month trend with slight variance (no real history in store yet)
    return getLastMonths(6).map((m, i) => ({
      month: m.label,
      netWorth: Math.round(base * (0.88 + i * 0.024) + (Math.random() * 5000 - 2500)),
    }));
  }, [state]);

  const min = Math.min(...data.map(d => d.netWorth));
  const max = Math.max(...data.map(d => d.netWorth));
  const isUp = data[data.length-1].netWorth >= data[0].netWorth;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Net Worth Trend</h2>
          <p className="text-xs text-gray-400">6-month growth trajectory</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(Math.round(((data[data.length-1].netWorth - data[0].netWorth) / Math.abs(data[0].netWorth || 1)) * 100))}%
        </span>
      </div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} domain={[min * 0.95, max * 1.05]} />
            <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Area type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={2} fill="url(#nwGrad)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
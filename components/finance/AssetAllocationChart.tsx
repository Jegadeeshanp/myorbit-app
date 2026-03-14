'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '@/lib/financeStore';
import { useMemo } from 'react';

const COLORS = ['#10b981','#3b82f6','#f97316','#eab308','#8b5cf6','#06b6d4'];

function fmt(v: number) {
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  return `₹${(v/1000).toFixed(0)}K`;
}

export default function AssetAllocationChart() {
  const { state } = useFinance();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    state.assets.forEach(a => map.set(a.category, (map.get(a.category) ?? 0) + a.value));
    // Add cash from bank accounts
    const cash = state.accounts.filter(a => a.type === 'Bank' || a.type === 'Cash' || a.type === 'Wallet').reduce((s,a) => s + Math.max(0,a.balance), 0);
    if (cash > 0) map.set('Cash', (map.get('Cash') ?? 0) + cash);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [state]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Asset Allocation</h2>
        <p className="text-xs text-gray-400">Where your wealth is stored</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-[140px] w-[140px] flex-none">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate text-xs text-gray-600">{d.name}</span>
              </div>
              <div className="text-right flex-none">
                <span className="text-xs font-semibold text-gray-900">{fmt(d.value)}</span>
                <span className="ml-1 text-xs text-gray-400">{total > 0 ? Math.round((d.value/total)*100) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

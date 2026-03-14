'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AssetTable from '@/components/finance/AssetTable';
import AddAssetModal from '@/components/finance/AddAssetModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';

const DONUT_COLORS = ['#10b981','#3b82f6','#f97316','#eab308','#8b5cf6','#06b6d4'];

type Tab = 'Assets' | 'Liabilities' | 'Net Worth' | 'Allocation';

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(2)}L`;
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function getInvested(value: number, category: string) {
  const r: Record<string, number> = { Stocks: 0.72, 'Mutual Funds': 0.78, 'Real Estate': 0.60, Gold: 0.82 };
  return Math.round(value * (r[category] ?? 0.80));
}

export default function AssetsPage() {
  const { state, addAsset } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Assets');
  const [search, setSearch] = useState('');

  const totalValue    = useMemo(() => state.assets.reduce((s,a) => s + a.value, 0), [state.assets]);
  const totalInvested = useMemo(() => state.assets.reduce((s,a) => s + getInvested(a.value, a.category), 0), [state.assets]);
  const totalPnl      = totalValue - totalInvested;
  const pnlPct        = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(1) : '0';

  const totalLiab     = useMemo(() => state.liabilities.reduce((s,l) => s + l.outstanding, 0), [state.liabilities]);
  const netWorth      = totalValue - totalLiab;

  const allocationData = useMemo(() => {
    const map = new Map<string, number>();
    state.assets.forEach(a => map.set(a.category, (map.get(a.category) ?? 0) + a.value));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [state.assets]);

  const filteredAssets = useMemo(() =>
    search.trim() ? state.assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())) : state.assets,
  [state.assets, search]);

  const TABS: Tab[] = ['Assets', 'Liabilities', 'Net Worth', 'Allocation'];

  return (
    <div className="space-y-5">
      <FinanceTopBar action={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…"
              className="w-40 rounded-full border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
          <button onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            <PlusCircle className="h-4 w-4" /> Add Asset
          </button>
        </div>
      } />

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invested',       value: fmt(totalInvested), icon: DollarSign,   color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Current Value',  value: fmt(totalValue),    icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: `P&L (+${pnlPct}%)`, value: fmt(totalPnl),  icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        ].map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} bg-white p-4 shadow-sm`}>
            <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{m.label}</p>
              <p className={`text-sm font-bold truncate ${m.color}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${tab === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Assets' && <AssetTable assets={filteredAssets} />}

      {tab === 'Liabilities' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Liability', 'Outstanding', 'Monthly EMI'].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${h !== 'Liability' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {state.liabilities.map(l => (
                <tr key={l.id} className="transition hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{l.name}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-rose-600">{fmt(l.outstanding)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500">{fmt(l.monthlyEmi)}/mo</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-100 bg-gray-50/60">
                <td className="px-5 py-3 text-xs font-semibold text-gray-500">{state.liabilities.length} liabilities</td>
                <td className="px-5 py-3 text-right text-sm font-bold text-rose-600">{fmt(totalLiab)}</td>
                <td className="px-5 py-3 text-right text-xs text-gray-400">{fmt(state.liabilities.reduce((s,l) => s + l.monthlyEmi, 0))}/mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'Net Worth' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: 'Total Assets',      value: fmt(totalValue), sub: `${state.assets.length} assets`,      color: 'text-emerald-600' },
              { label: 'Total Liabilities', value: fmt(totalLiab),  sub: `${state.liabilities.length} loans`,  color: 'text-rose-600' },
              { label: 'Net Worth',         value: fmt(netWorth),   sub: `+${pnlPct}% P&L on investments`,     color: netWorth >= 0 ? 'text-gray-900' : 'text-rose-600' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{item.label}</p>
                <p className={`mt-2 text-3xl font-bold ${item.color}`}>{item.value}</p>
                <p className="mt-1 text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Allocation' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Asset Allocation</h2>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                    {allocationData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Breakdown</h2>
            <div className="space-y-3">
              {allocationData.map((d, i) => {
                const pct = totalValue > 0 ? Math.round((d.value / totalValue) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="font-medium text-gray-700">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{fmt(d.value)}</span>
                        <span className="text-gray-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AddAssetModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAsset} />
    </div>
  );
}
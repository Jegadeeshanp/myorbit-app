'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AssetTable from '@/components/finance/AssetTable';
import AddAssetModal from '@/components/finance/AddAssetModal';
import FinanceTopBar from '@/components/finance/FinanceTopBar';
import { useFinance } from '@/lib/financeStore';
import { getCategoryConfig, ASSET_CATEGORIES } from '@/lib/assetCategories';
import { AssetsSkeleton } from '@/components/finance/SkeletonLoader';

const DONUT_COLORS = ['#10b981','#3b82f6','#f97316','#eab308','#8b5cf6','#06b6d4','#ec4899','#f43f5e','#84cc16','#a855f7'];

function fmt(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function AssetsPage() {
  const { state, addAsset, updateAsset } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editTarget,  setEditTarget] = useState<import('@/lib/financeData').Asset | null>(null);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);

  const accountList = state.accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

  // Derive tabs dynamically from assets present in the store
  const availableTabs = useMemo(() => {
    const presentCategories = new Set(state.assets.map(a => a.category));
    return ['All', ...ASSET_CATEGORIES
      .filter(c => presentCategories.has(c.label))
      .map(c => c.label)
    ];
  }, [state.assets]);

  // If active tab was removed (e.g. last asset of that type deleted), fall back to All
  const safeTab = availableTabs.includes(activeTab) ? activeTab : 'All';

  const filteredAssets = useMemo(() => {
    let assets = state.assets;
    if (safeTab !== 'All') assets = assets.filter(a => a.category === safeTab);
    if (search.trim()) assets = assets.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    );
    return assets;
  }, [state.assets, safeTab, search]);

  const totalValue    = useMemo(() => filteredAssets.reduce((s, a) => s + a.value, 0), [filteredAssets]);
  const totalInvested = useMemo(() => filteredAssets.reduce((s, a) => s + a.invested, 0), [filteredAssets]);
  const totalPnl      = totalValue - totalInvested;
  const pnlPct        = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(1) : '0';
  const pnlPositive   = totalPnl >= 0;

  const allAssetsValue = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets]);

  const allocationData = useMemo(() => {
    const map = new Map<string, number>();
    state.assets.forEach(a => map.set(a.category, (map.get(a.category) ?? 0) + a.value));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [state.assets]);

  if (state.loadState === 'loading') return <AssetsSkeleton />;

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invested',             value: fmt(totalInvested), icon: DollarSign,  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Current Value',        value: fmt(totalValue),    icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: `P&L (${pnlPositive ? '+' : ''}${pnlPct}%)`, value: fmt(Math.abs(totalPnl)), icon: pnlPositive ? TrendingUp : TrendingDown,
            color: pnlPositive ? 'text-emerald-600' : 'text-rose-600',
            bg:    pnlPositive ? 'bg-emerald-50'    : 'bg-rose-50',
            border:pnlPositive ? 'border-emerald-100' : 'border-rose-100' },
        ].map(m => (
          <div key={m.label} className={`flex items-center gap-2 sm:gap-3 rounded-2xl border ${m.border} bg-white p-3 sm:p-4 shadow-sm`}>
            <div className={`hidden sm:flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-gray-400">{m.label}</p>
              <p className={`truncate text-sm font-bold ${m.color}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search (left) + Add (right) ── */}
      <div className="flex items-center gap-2">
        {/* Mobile: tap icon to expand search */}
        {mobileSearch ? (
          <div className="flex sm:hidden flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setMobileSearch(false); }}
              placeholder="Search assets…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none" />
          </div>
        ) : (
          <button onClick={() => setMobileSearch(true)}
            className="flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:bg-gray-50">
            <Search className="h-4 w-4" />
          </button>
        )}
        {/* Desktop: always visible */}
        <div className="relative hidden sm:flex w-64 flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…"
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-8 pr-4 text-sm focus:border-emerald-400 focus:outline-none" />
        </div>
        <div className="ml-auto">
          <button onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
            <PlusCircle className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* Dynamic category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {availableTabs.map(tab => {
          const isActive = safeTab === tab;
          const cfg = tab !== 'All' ? getCategoryConfig(tab) : null;
          const Icon = cfg?.icon;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />}
              {tab}
              {tab !== 'All' && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {state.assets.filter(a => a.category === tab).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Asset table */}
      {filteredAssets.length > 0
        ? <AssetTable assets={filteredAssets} totalPortfolioValue={allAssetsValue} onEdit={setEditTarget} />
        : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
            <TrendingUp className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No assets in this category</p>
            <button onClick={() => setModalOpen(true)} className="mt-3 text-xs font-medium text-emerald-600 hover:text-emerald-700">
              + Add your first asset
            </button>
          </div>
        )
      }

      {/* Allocation breakdown — shown when All tab or more than 1 category */}
      {safeTab === 'All' && allocationData.length > 1 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Allocation</h2>
          <p className="mb-4 text-xs text-gray-400">Distribution across asset classes</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="h-[180px] w-[180px] flex-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={50} outerRadius={82} paddingAngle={3} strokeWidth={0}>
                    {allocationData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend — icon + name + value + % only, NO progress bars */}
            <div className="flex-1 w-full space-y-2.5">
              {allocationData.map((d, i) => {
                const pct = allAssetsValue > 0 ? Math.round((d.value / allAssetsValue) * 100) : 0;
                const cfg = getCategoryConfig(d.name);
                const Icon = cfg.icon;
                return (
                  <div key={d.name} className="flex items-center gap-2.5 text-xs">
                    <div className="flex h-5 w-5 flex-none items-center justify-center rounded-md"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] + '22' }}>
                      <Icon className="h-3 w-3" style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    </div>
                    <span className="flex-1 font-medium text-gray-700 truncate">{d.name}</span>
                    <span className="font-semibold text-gray-900">{fmt(d.value)}</span>
                    <span className="w-9 text-right font-medium" style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AddAssetModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAsset} accounts={accountList} />
      <AddAssetModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
        accounts={accountList}
        onSave={payload => {
          if (!editTarget) return;
          updateAsset({ ...payload, id: editTarget.id });
          setEditTarget(null);
        }}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Search, TrendingUp, TrendingDown, DollarSign, Camera, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import AssetTable from '@/components/finance/AssetTable';
import AddAssetModal from '@/components/finance/AddAssetModal';
import ImageImportModal from '@/components/finance/ImageImportModal';
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
  const { state, addAsset, updateAsset, refreshAssetPrices } = useFinance();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isScanOpen, setScanOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const [editTarget,  setEditTarget] = useState<import('@/lib/financeData').Asset | null>(null);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');

  // All hooks must run before any early return (Rules of Hooks)
  const availableTabs = useMemo(() => {
    const presentCategories = new Set(state.assets.map(a => a.category));
    return ['All', ...ASSET_CATEGORIES
      .filter(c => presentCategories.has(c.label))
      .map(c => c.label)
    ];
  }, [state.assets]);

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

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await refreshAssetPrices();
      const rate = res.usdInr ? ` · $1 = ₹${Math.round(res.usdInr)}` : '';
      const failNote = res.failed?.length ? ` (${res.failed.join(', ')} not found)` : '';
      setRefreshMsg(`Updated ${res.updated} asset${res.updated !== 1 ? 's' : ''}${rate}${failNote}`);
    } catch {
      setRefreshMsg('Refresh failed — check your internet connection');
    } finally {
      setRefreshing(false);
    }
  }

  if (state.loadState === 'loading') return <AssetsSkeleton />;

  return (
    <div className="space-y-5">
      <FinanceTopBar />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {[
          { label: 'Invested',      value: fmt(totalInvested),        icon: DollarSign,                              color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Current Value', value: fmt(totalValue),           icon: TrendingUp,                              color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: `P&L (${pnlPositive ? '+' : ''}${pnlPct}%)`,
            value: fmt(Math.abs(totalPnl)),
            icon:  pnlPositive ? TrendingUp : TrendingDown,
            color: pnlPositive ? 'text-emerald-600' : 'text-rose-600',
            bg:    pnlPositive ? 'bg-emerald-50'    : 'bg-rose-50',
            border:pnlPositive ? 'border-emerald-100' : 'border-rose-100' },
        ].map(m => (
          <div key={m.label} className={`flex items-center gap-3 rounded-2xl border ${m.border} dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] px-4 py-3 sm:p-4 shadow-sm`}>
            <div className={`hidden sm:flex h-9 w-9 flex-none items-center justify-center rounded-xl ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div className="flex flex-1 items-center justify-between sm:block min-w-0">
              <p className="truncate text-xs text-gray-400 dark:text-[#3d5166]">{m.label}</p>
              <p className={`truncate text-sm font-bold ${m.color}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Add controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets…"
            className="w-full rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] py-2 pl-8 pr-3 text-sm text-gray-900 dark:text-[#e4eaf4] placeholder:text-gray-400 dark:placeholder:text-[#3d5166] focus:border-emerald-400 dark:focus:border-[#00E5A0] focus:outline-none sm:w-52" />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0b1019] px-4 py-2 text-sm font-semibold text-gray-600 dark:text-[#8fa3b8] shadow-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh Prices'}
        </button>
        <button
          onClick={() => setScanOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-[#00E5A0]/30 bg-white dark:bg-[#0b1019] px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-[#00E5A0] shadow-sm transition hover:bg-emerald-50 dark:hover:bg-[#00e5a0]/[0.07] whitespace-nowrap"
        >
          <Camera className="h-4 w-4" /> Scan Screenshot
        </button>
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 dark:bg-[#00E5A0] px-4 py-2 text-sm font-semibold text-white dark:text-black shadow-sm transition hover:bg-emerald-700 dark:hover:bg-[#00c990] whitespace-nowrap">
          <PlusCircle className="h-4 w-4" /> Add Asset
        </button>
      </div>
      {refreshMsg && (
        <p className="text-xs text-gray-500 dark:text-[#8fa3b8]">{refreshMsg}</p>
      )}

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
                  ? 'border-emerald-500 dark:border-[#00E5A0]/60 bg-emerald-50 dark:bg-[#00e5a0]/[0.1] text-emerald-700 dark:text-[#00E5A0] shadow-sm'
                  : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent text-gray-500 dark:text-[#8fa3b8] hover:border-gray-300 dark:hover:border-white/[0.15] hover:text-gray-700 dark:hover:text-[#e4eaf4]'
              }`}
            >
              {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-gray-400 dark:text-[#3d5166]'}`} />}
              {tab}
              {tab !== 'All' && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-emerald-100 dark:bg-[#00e5a0]/[0.2] text-emerald-700 dark:text-[#00E5A0]' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-[#3d5166]'}`}>
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.1] bg-gray-50/50 dark:bg-white/[0.02] py-12 text-center">
            <TrendingUp className="h-8 w-8 text-gray-300 dark:text-[#3d5166] mb-3" />
            <p className="text-sm text-gray-500 dark:text-[#8fa3b8]">No assets in this category</p>
            <button onClick={() => setModalOpen(true)} className="mt-3 text-xs font-medium text-emerald-600 dark:text-[#00E5A0] hover:text-emerald-700 dark:hover:text-[#00c990]">
              + Add your first asset
            </button>
          </div>
        )
      }

      {/* Allocation breakdown — shown when All tab or more than 1 category */}
      {safeTab === 'All' && allocationData.length > 1 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Allocation</h2>
            <p className="mb-4 text-xs text-gray-400 dark:text-[#3d5166]">Distribution across asset classes</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                    {allocationData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, background: '#0e1420', color: '#e4eaf4' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">Breakdown</h2>
            <div className="space-y-3">
              {allocationData.map((d, i) => {
                const pct = allAssetsValue > 0 ? Math.round((d.value / allAssetsValue) * 100) : 0;
                const cfg = getCategoryConfig(d.name);
                const Icon = cfg.icon;
                return (
                  <div key={d.name}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] + '20' }}>
                          <Icon className="h-3 w-3" style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-[#8fa3b8]">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{fmt(d.value)}</span>
                        <span className="w-8 text-right text-gray-400 dark:text-[#3d5166]">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isScanOpen && <ImageImportModal onClose={() => setScanOpen(false)} />}
      <AddAssetModal open={isModalOpen} onClose={() => setModalOpen(false)} onSave={addAsset} accounts={state.accounts} />
      <AddAssetModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
        accounts={state.accounts}
        onSave={payload => {
          if (!editTarget) return;
          updateAsset({ ...payload, id: editTarget.id });
          setEditTarget(null);
        }}
      />
    </div>
  );
}

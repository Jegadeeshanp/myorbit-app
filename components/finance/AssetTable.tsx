'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Asset } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { getCategoryConfig } from '@/lib/assetCategories';
import { Trash2, Pencil, MoreVertical, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function fmtShort(v: number) {
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

type Props = {
  assets: Asset[];
  totalPortfolioValue?: number;
  onEdit?: (asset: Asset) => void;
};

type SortKey = 'name' | 'category' | 'units' | 'invested' | 'value' | 'pnl' | 'allocation';
const COL_SORT: Record<string, SortKey | undefined> = {
  Asset: 'name', Category: 'category', Units: 'units',
  Invested: 'invested', 'Current Value': 'value', 'P&L': 'pnl', Allocation: 'allocation',
};
const RIGHT_COLS = new Set(['Units', 'Invested', 'Current Value', 'P&L', 'Allocation']);

function CardMenu({ onEdit, onDelete }: { onEdit?: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-none">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-[#3d5166] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#0e1420] shadow-lg py-1">
          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-[#8fa3b8] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-400 dark:text-[#3d5166]" />
              Edit
            </button>
          )}
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 dark:text-[#FF6B6B] hover:bg-rose-50 dark:hover:bg-[#FF6B6B]/[0.1] transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function fmtUnitPrice(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatInvestmentType(raw: string) {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function AssetDetailSheet({
  asset, onClose, onEdit, onDelete,
}: {
  asset: Asset;
  onClose: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const cfg    = getCategoryConfig(asset.category);
  const Icon   = cfg.icon;
  const pnl    = asset.value - asset.invested;
  const pnlPct = asset.invested > 0 ? ((pnl / asset.invested) * 100).toFixed(1) : '0';
  const a      = asset as any;

  const units: number | null = a.units != null && a.units > 0 ? a.units : null;
  const avgBuyPrice     = units ? asset.invested / units : null;
  const currentPrice    = units ? asset.value    / units : null;
  const priceChangePct  = avgBuyPrice && currentPrice
    ? (((currentPrice - avgBuyPrice) / avgBuyPrice) * 100).toFixed(1)
    : null;

  let sipData: { amount?: number; frequency?: string; nextDate?: string } | null = null;
  try {
    if (a.sipConfig) sipData = typeof a.sipConfig === 'string' ? JSON.parse(a.sipConfig) : a.sipConfig;
  } catch { /* ignore */ }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#0e1420] shadow-2xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* drag handle – mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-white/[0.1]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${cfg.tagBg}`}>
              <Icon className={`h-5 w-5 ${cfg.tagText}`} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-[#e4eaf4]">{asset.name}</h2>
              <span className={`text-xs font-medium ${cfg.tagText}`}>{asset.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Value + Invested */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3.5">
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">Current Value</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-[#e4eaf4]">{fmt(asset.value)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3.5">
              <p className="text-xs text-gray-400 dark:text-[#3d5166]">Total Invested</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-[#e4eaf4]">{fmt(asset.invested)}</p>
            </div>
          </div>

          {/* P&L */}
          <div className={`rounded-xl border p-3.5 ${pnl >= 0 ? 'border-emerald-100 dark:border-[#00E5A0]/20 bg-emerald-50 dark:bg-[#00e5a0]/[0.07]' : 'border-rose-100 dark:border-[#FF6B6B]/20 bg-rose-50 dark:bg-[#FF6B6B]/[0.07]'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-[#8fa3b8]">Profit / Loss</span>
              <div className="text-right">
                <p className={`text-base font-bold ${pnl >= 0 ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                  {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                </p>
                <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-500 dark:text-[#00E5A0]/80' : 'text-rose-400 dark:text-[#FF6B6B]/80'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPct}%
                </p>
              </div>
            </div>
          </div>

          {/* Unit prices — only shown when units are tracked */}
          {avgBuyPrice !== null && currentPrice !== null && (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06] rounded-xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-400 dark:text-[#3d5166]">Avg Buy Price</span>
                <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{fmtUnitPrice(avgBuyPrice)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-400 dark:text-[#3d5166]">Current Price</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{fmtUnitPrice(currentPrice)}</p>
                  {priceChangePct !== null && (
                    <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-500 dark:text-[#00E5A0]/80' : 'text-rose-400 dark:text-[#FF6B6B]/80'}`}>
                      {pnl >= 0 ? '+' : ''}{priceChangePct}% vs buy
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Units / Symbol / Type */}
          {(units != null || asset.symbol || a.investmentType) && (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06] rounded-xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
              {units != null && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Units held</span>
                  <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{units}</span>
                </div>
              )}
              {asset.symbol && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Symbol</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-[#e4eaf4]">{asset.symbol}</span>
                </div>
              )}
              {a.investmentType && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Type</span>
                  <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{formatInvestmentType(a.investmentType)}</span>
                </div>
              )}
            </div>
          )}

          {/* SIP details */}
          {sipData && (
            <div className="rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/[0.07] px-4 py-3.5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">SIP Details</p>
              {sipData.amount != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Monthly SIP</span>
                  <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">{fmt(sipData.amount)}</span>
                </div>
              )}
              {sipData.frequency && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Frequency</span>
                  <span className="font-semibold text-gray-900 dark:text-[#e4eaf4] capitalize">{sipData.frequency}</span>
                </div>
              )}
              {sipData.nextDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 dark:text-[#3d5166]">Next SIP</span>
                  <span className="font-semibold text-gray-900 dark:text-[#e4eaf4]">
                    {new Date(sipData.nextDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 border-t border-gray-100 dark:border-white/[0.07] px-5 py-4 flex-none">
          {onEdit && (
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] py-2.5 text-sm font-semibold text-gray-700 dark:text-[#e4eaf4] hover:bg-gray-50 dark:hover:bg-white/[0.08] transition"
            >
              Edit Asset
            </button>
          )}
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="rounded-xl border border-rose-200 dark:border-[#FF6B6B]/30 bg-rose-50 dark:bg-[#FF6B6B]/[0.07] px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-[#FF6B6B] hover:bg-rose-100 dark:hover:bg-[#FF6B6B]/[0.15] transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetTable({ assets, totalPortfolioValue, onEdit }: Props) {
  const { deleteAsset } = useFinance();
  const [confirmTarget, setConfirmTarget] = useState<Asset | null>(null);
  const [detailAsset,   setDetailAsset]   = useState<Asset | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedAssets = useMemo(() => {
    if (!sortKey) return assets;
    return [...assets].sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortKey) {
        case 'name':       av = a.name.toLowerCase();         bv = b.name.toLowerCase();        break;
        case 'category':   av = a.category.toLowerCase();     bv = b.category.toLowerCase();    break;
        case 'units':      av = (a as any).units ?? -1;       bv = (b as any).units ?? -1;      break;
        case 'invested':   av = a.invested;                   bv = b.invested;                  break;
        case 'value':      av = a.value;                      bv = b.value;                     break;
        case 'pnl':        av = a.value - a.invested;         bv = b.value - b.invested;        break;
        case 'allocation': av = a.value;                      bv = b.value;                     break;
        default:           av = 0;                            bv = 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [assets, sortKey, sortDir]);

  const tableTotal = sortedAssets.reduce((s, a) => s + a.value, 0);
  const allocBase  = totalPortfolioValue ?? tableTotal;

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  if (assets.length === 0) return null;

  return (
    <>
      {/* ── Desktop table ─────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02]">
              {['Asset', 'Category', 'Units', 'Invested', 'Current Value', 'P&L', 'Allocation', ''].map(h => {
                const key = COL_SORT[h];
                const active = !!key && sortKey === key;
                const Icon = active ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${active ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-gray-400 dark:text-[#3d5166]'} ${RIGHT_COLS.has(h) ? 'text-right' : ''}`}>
                    {key ? (
                      <button
                        onClick={() => handleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-[#e4eaf4] transition"
                      >
                        {h}<Icon className={`h-3 w-3 flex-none ${active ? 'opacity-100' : 'opacity-40'}`} />
                      </button>
                    ) : h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
            {sortedAssets.map(asset => {
              const cfg      = getCategoryConfig(asset.category);
              const Icon     = cfg.icon;
              const invested = asset.invested;
              const pnl      = asset.value - invested;
              const pnlPct   = invested > 0 ? Math.round((pnl / invested) * 100) : 0;
              const allocPct = allocBase > 0 ? Math.round((asset.value / allocBase) * 100) : 0;

              return (
                <tr key={asset.id} className="group transition hover:bg-gray-50/50 dark:hover:bg-white/[0.03] cursor-pointer" onClick={() => setDetailAsset(asset)}>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">{asset.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                      <Icon className="h-3 w-3" />
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-400 dark:text-[#3d5166]">
                    {(asset as any).units != null ? (asset as any).units : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500 dark:text-[#8fa3b8]">{fmt(invested)}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">{fmt(asset.value)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                      {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                    </p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-emerald-500 dark:text-[#00E5A0]/80' : 'text-rose-400 dark:text-[#FF6B6B]/80'}`}>
                      {pnl >= 0 ? '+' : ''}{pnlPct}%
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                        <div className={`h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} style={{ width: `${allocPct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-gray-500 dark:text-[#8fa3b8]">{allocPct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(asset)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-[#3d5166] opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-500 dark:hover:text-[#8fa3b8]"
                          title="Edit asset"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmTarget(asset)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 dark:text-[#3d5166] opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-[#FF6B6B]/[0.1] hover:text-rose-400 dark:hover:text-[#FF6B6B]"
                        title="Delete asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02]">
              <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">{assets.length} asset{assets.length !== 1 ? 's' : ''}</td>
              <td className="px-5 py-3" />
              <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">
                {fmt(assets.reduce((s, a) => s + a.invested, 0))}
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-gray-900 dark:text-[#e4eaf4]">{fmt(tableTotal)}</td>
              <td className="px-5 py-3 text-right">
                {(() => {
                  const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
                  return (
                    <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                      {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}
                    </span>
                  );
                })()}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────────── */}
      <div className="sm:hidden rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gradient-to-br dark:from-[#131c2e] dark:to-[#0e1420] shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.04]">
        {assets.map(asset => {
          const cfg    = getCategoryConfig(asset.category);
          const Icon   = cfg.icon;
          const pnl    = asset.value - asset.invested;
          const pnlPct = asset.invested > 0 ? Math.round((pnl / asset.invested) * 100) : 0;

          return (
            <div
              key={asset.id}
              className="relative px-4 py-3.5 hover:bg-gray-50/70 dark:hover:bg-white/[0.03] active:bg-gray-100/80 dark:active:bg-white/[0.05] cursor-pointer transition"
              onClick={() => setDetailAsset(asset)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-[#e4eaf4]">{asset.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                      <Icon className="h-2.5 w-2.5" />
                      {asset.category}
                    </span>
                    {asset.units != null && (
                      <span className="text-[11px] text-gray-400 dark:text-[#3d5166]">{asset.units} units</span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-none">
                  <p className="text-sm font-bold text-gray-900 dark:text-[#e4eaf4]">{fmtShort(asset.value)}</p>
                  <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                    {pnl >= 0 ? '+' : ''}{fmtShort(pnl)}&nbsp;({pnl >= 0 ? '+' : ''}{pnlPct}%)
                  </p>
                </div>

                {/* CardMenu stops propagation so it doesn't open the detail sheet */}
                <div onClick={e => e.stopPropagation()}>
                  <CardMenu
                    onEdit={onEdit ? () => onEdit(asset) : undefined}
                    onDelete={() => setConfirmTarget(asset)}
                  />
                </div>
              </div>

              {/* Invested row */}
              <p className="mt-1.5 text-xs text-gray-400 dark:text-[#3d5166]">
                Invested {fmtShort(asset.invested)}
              </p>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60 dark:bg-white/[0.02]">
          <p className="text-xs font-semibold text-gray-500 dark:text-[#8fa3b8]">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 dark:text-[#e4eaf4]">{fmt(tableTotal)}</p>
            {(() => {
              const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
              return (
                <p className={`text-xs font-medium ${totalPnl >= 0 ? 'text-emerald-600 dark:text-[#00E5A0]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
                  {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)} total P&L
                </p>
              );
            })()}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete asset"
        description={`This will permanently delete "${confirmTarget?.name ?? ''}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => { if (confirmTarget) deleteAsset(confirmTarget.id); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />

      {detailAsset && (
        <AssetDetailSheet
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onEdit={onEdit ? () => { onEdit(detailAsset); } : undefined}
          onDelete={() => { setConfirmTarget(detailAsset); setDetailAsset(null); }}
        />
      )}
    </>
  );
}

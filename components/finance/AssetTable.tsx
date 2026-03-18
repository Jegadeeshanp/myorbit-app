'use client';

import { useState, useRef, useEffect } from 'react';
import { Asset } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { getCategoryConfig } from '@/lib/assetCategories';
import { Trash2, Pencil, MoreVertical } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

type Props = {
  assets: Asset[];
  totalPortfolioValue?: number;
  onEdit?: (asset: Asset) => void;
};

// ── Dots menu for mobile card ─────────────────────────────────────────────
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
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-gray-100 bg-white shadow-lg py-1">
          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Pencil className="h-3.5 w-3.5 text-gray-400" />
              Edit
            </button>
          )}
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AssetTable({ assets, totalPortfolioValue, onEdit }: Props) {
  const { deleteAsset } = useFinance();
  const tableTotal = assets.reduce((s, a) => s + a.value, 0);
  const allocBase  = totalPortfolioValue ?? tableTotal;
  const [confirmTarget, setConfirmTarget] = useState<Asset | null>(null);

  if (assets.length === 0) return null;

  return (
    <>
      {/* ── Desktop table (hidden on mobile) ──────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Asset', 'Category', 'Units', 'Invested', 'Current Value', 'P&L', 'Allocation', ''].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${['Units','Invested','Current Value','P&L','Allocation'].includes(h) ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assets.map(asset => {
              const cfg      = getCategoryConfig(asset.category);
              const Icon     = cfg.icon;
              const invested = asset.invested;
              const pnl      = asset.value - invested;
              const pnlPct   = invested > 0 ? Math.round((pnl / invested) * 100) : 0;
              // Use the full portfolio base for allocation so all assets always sum to 100%
              const allocPct = allocBase > 0 ? Math.round((asset.value / allocBase) * 100) : 0;

              return (
                <tr key={asset.id} className="group transition hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{asset.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                      <Icon className="h-3 w-3" />
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-400">
                    {(asset as any).units != null ? (asset as any).units : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-gray-500">{fmt(invested)}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{fmt(asset.value)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pnl >= 0 ? '+' : ''}{fmt(pnl)}
                    </p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {pnl >= 0 ? '+' : ''}{pnlPct}%
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} style={{ width: `${allocPct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-gray-500">{allocPct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(asset)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500"
                          title="Edit asset"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmTarget(asset)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
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
            <tr className="border-t border-gray-100 bg-gray-50/60">
              <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500">{assets.length} asset{assets.length !== 1 ? 's' : ''}</td>
              <td className="px-5 py-3" />
              <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                {fmt(assets.reduce((s, a) => s + a.invested, 0))}
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">{fmt(tableTotal)}</td>
              <td className="px-5 py-3 text-right">
                {(() => {
                  const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
                  return (
                    <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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

      {/* ── Mobile cards (hidden on sm+) ───────────────────────────────── */}
      <div className="sm:hidden rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
        {assets.map(asset => {
          const cfg    = getCategoryConfig(asset.category);
          const Icon   = cfg.icon;
          const pnl    = asset.value - asset.invested;
          const pnlPct = asset.invested > 0 ? Math.round((pnl / asset.invested) * 100) : 0;

          return (
            <div key={asset.id} className="flex items-center gap-3 px-4 py-3">
              {/* Col 1: name + category */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{asset.name}</p>
                <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.tagBg} ${cfg.tagText}`}>
                  <Icon className="h-2.5 w-2.5" />
                  {asset.category}
                </span>
              </div>

              {/* Col 2: current value + P&L */}
              <div className="text-right flex-none">
                <p className="text-sm font-semibold text-gray-900">{fmt(asset.value)}</p>
                <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pnl >= 0 ? '+' : ''}{fmt(pnl)}&nbsp;
                  <span className="text-[10px]">({pnl >= 0 ? '+' : ''}{pnlPct}%)</span>
                </p>
              </div>

              {/* Col 3: dots menu */}
              <CardMenu
                onEdit={onEdit ? () => onEdit(asset) : undefined}
                onDelete={() => setConfirmTarget(asset)}
              />
            </div>
          );
        })}

        {/* Mobile footer total */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/60">
          <p className="text-xs font-semibold text-gray-500">{assets.length} asset{assets.length !== 1 ? 's' : ''}</p>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{fmt(tableTotal)}</p>
            {(() => {
              const totalPnl = tableTotal - assets.reduce((s, a) => s + a.invested, 0);
              return (
                <p className={`text-xs font-medium ${totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
    </>
  );
}

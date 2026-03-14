'use client';

import { Asset } from '@/lib/financeData';
import { useFinance } from '@/lib/financeStore';
import { getCategoryConfig } from '@/lib/assetCategories';
import { Trash2 } from 'lucide-react';

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

type Props = {
  assets: Asset[];
  totalPortfolioValue?: number;
};

export default function AssetTable({ assets, totalPortfolioValue }: Props) {
  const { deleteAsset } = useFinance();
  const tableTotal  = assets.reduce((s, a) => s + a.value, 0);
  const allocBase   = totalPortfolioValue ?? tableTotal;

  if (assets.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {['Asset', 'Category', 'Invested', 'Current Value', 'P&L', 'Allocation', ''].map(h => (
              <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${['Invested','Current Value','P&L','Allocation'].includes(h) ? 'text-right' : ''}`}>
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
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-400"
                    title="Delete asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-100 bg-gray-50/60">
            <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500">{assets.length} asset{assets.length !== 1 ? 's' : ''}</td>
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
  );
}
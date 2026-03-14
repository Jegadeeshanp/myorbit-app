'use client';

import { Asset } from '@/lib/financeData';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Stocks':       { bg: 'bg-blue-100',    text: 'text-blue-700' },
  'Mutual Funds': { bg: 'bg-purple-100',  text: 'text-purple-700' },
  'Real Estate':  { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'Gold':         { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  'Cash':         { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

function fmt(v: number) {
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

// Simulate invested = 80% of current value, PnL = 20%
function getInvested(value: number, category: string) {
  const ratios: Record<string, number> = { Stocks: 0.72, 'Mutual Funds': 0.78, 'Real Estate': 0.60, Gold: 0.82 };
  return Math.round(value * (ratios[category] ?? 0.80));
}

export default function AssetTable({ assets }: { assets: Asset[] }) {
  const total = assets.reduce((s, a) => s + a.value, 0);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {['Asset', 'Type', 'Invested', 'Current Value', 'P&L', 'Allocation'].map(h => (
              <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 ${h === 'Invested' || h === 'Current Value' || h === 'P&L' || h === 'Allocation' ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {assets.map(asset => {
            const invested = getInvested(asset.value, asset.category);
            const pnl      = asset.value - invested;
            const pnlPct   = invested > 0 ? Math.round((pnl / invested) * 100) : 0;
            const allocPct = total > 0 ? Math.round((asset.value / total) * 100) : 0;
            const tag      = TAG_COLORS[asset.category] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
            return (
              <tr key={asset.id} className="transition hover:bg-gray-50/50">
                <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{asset.name}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tag.bg} ${tag.text}`}>{asset.category}</span>
                </td>
                <td className="px-5 py-3.5 text-right text-sm text-gray-500">{fmt(invested)}</td>
                <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{fmt(asset.value)}</td>
                <td className="px-5 py-3.5 text-right">
                  <p className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pnl >= 0 ? '+' : ''}{fmt(pnl)}</p>
                  <p className={`text-xs ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>{pnl >= 0 ? '+' : ''}{pnlPct}%</p>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${allocPct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-500">{allocPct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-100 bg-gray-50/60">
            <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500">{assets.length} assets</td>
            <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
              {fmt(assets.reduce((s,a) => s + getInvested(a.value, a.category), 0))}
            </td>
            <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">{fmt(total)}</td>
            <td className="px-5 py-3 text-right">
              <span className="text-sm font-bold text-emerald-600">
                +{fmt(total - assets.reduce((s,a) => s + getInvested(a.value, a.category), 0))}
              </span>
            </td>
            <td className="px-5 py-3 text-right text-xs font-semibold text-gray-500">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

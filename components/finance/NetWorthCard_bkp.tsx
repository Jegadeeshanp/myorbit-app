'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/financeStore';
import { TrendingUp } from 'lucide-react';

function fmt(v: number) {
  return Math.abs(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function NetWorthCard() {
  const { state } = useFinance();
  const { assets, liabilities } = state;

  const totalAssets      = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((s, l) => s + l.outstanding, 0), [liabilities]);
  const netWorth         = totalAssets - totalLiabilities;
  const isPositive       = netWorth >= 0;

  const assetPct      = totalAssets > 0 ? Math.round((totalAssets / (totalAssets + totalLiabilities)) * 100) : 0;
  const liabilityPct  = 100 - assetPct;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">

        {/* Left: net worth */}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Net Worth</p>
          <p className={`mt-1 text-3xl font-bold tracking-tight ${isPositive ? 'text-gray-900' : 'text-rose-600'}`}>
            {isPositive ? '' : '-'}{fmt(netWorth)}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">+4.2% this month</span>
          </div>
        </div>

        {/* Right: assets + liabilities */}
        <div className="flex flex-none items-center gap-6 rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Assets</p>
            <p className="mt-0.5 text-lg font-bold text-emerald-600">{fmt(totalAssets)}</p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Liabilities</p>
            <p className="mt-0.5 text-lg font-bold text-rose-500">{fmt(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* Progress bar: assets vs liabilities */}
      <div className="mt-4">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="bg-emerald-500 transition-all" style={{ width: `${assetPct}%` }} />
          <div className="bg-rose-400 transition-all" style={{ width: `${liabilityPct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-gray-400">
          <span>Assets {assetPct}%</span>
          <span>Liabilities {liabilityPct}%</span>
        </div>
      </div>
    </div>
  );
}

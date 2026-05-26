'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/financeStore';
import { TrendingUp } from 'lucide-react';

function fmt(v: number) {
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (Math.abs(v) >= 100000)   return `₹${(v / 100000).toFixed(2)}L`;
  return v.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function NetWorthCard() {
  const { state } = useFinance();
  const investedAssets   = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets]);
  const accountBalance   = useMemo(() => state.accounts.reduce((s, a) => s + a.balance, 0), [state.accounts]);
  const totalAssets      = investedAssets + accountBalance;
  const totalLiabilities = useMemo(() => state.liabilities.reduce((s, l) => s + l.outstanding, 0), [state.liabilities]);
  const netWorth         = totalAssets - totalLiabilities;
  const isPositive       = netWorth >= 0;
  const total            = totalAssets + totalLiabilities;
  const assetPct         = total > 0 ? Math.round((totalAssets / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-gradient-to-br from-emerald-50/60 via-white to-white dark:from-[#131c2e] dark:via-[#0e1420] dark:to-[#0e1420] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-[#3d5166]">Net Worth</p>

      <div className="mt-1 flex items-end justify-between gap-3">
        <p className={`text-4xl font-bold tracking-tight leading-none ${isPositive ? 'text-gray-900 dark:text-[#e4eaf4]' : 'text-rose-600 dark:text-[#FF6B6B]'}`}>
          {isPositive ? '' : '-'}{fmt(Math.abs(netWorth))}
        </p>
        {total > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-[#00e5a0]/[0.1] px-2.5 py-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-[#00E5A0]" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-[#00E5A0]">
              {assetPct}% in assets
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="text-gray-400 dark:text-[#3d5166]">Assets</span>
        <span className="font-semibold text-emerald-600 dark:text-[#00E5A0]">{fmt(totalAssets)}</span>
        <span className="text-gray-200 dark:text-white/[0.07]">•</span>
        <span className="text-gray-400 dark:text-[#3d5166]">Liabilities</span>
        <span className="font-semibold text-rose-500 dark:text-[#FF6B6B]">{fmt(totalLiabilities)}</span>
      </div>

      <div className="mt-3">
        <div className="flex h-[5px] w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
          <div className="bg-emerald-500 dark:bg-[#00E5A0] transition-all" style={{ width: `${assetPct}%` }} />
          <div className="bg-rose-400 dark:bg-[#FF6B6B] transition-all" style={{ width: `${100 - assetPct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-[#3d5166]">
          <span>{assetPct}% assets</span>
          <span>{100 - assetPct}% liabilities</span>
        </div>
      </div>
    </div>
  );
}

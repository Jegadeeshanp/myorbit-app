'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/financeStore';
import { formatINRCompact, formatINR } from '@/lib/currency';
import { TrendingUp } from 'lucide-react';

export default function NetWorthCard() {
  const { state } = useFinance();
  const totalAssets      = useMemo(() => state.assets.reduce((s, a) => s + a.value, 0), [state.assets]);
  const totalLiabilities = useMemo(() => state.liabilities.reduce((s, l) => s + l.outstanding, 0), [state.liabilities]);
  // Account balances (bank accounts, wallets) are part of net worth too
  const accountBalance   = useMemo(() => state.accounts.reduce((s, a) => s + a.balance, 0), [state.accounts]);
  const netWorth         = totalAssets + accountBalance - totalLiabilities;
  const isPositive       = netWorth >= 0;
  const total            = totalAssets + totalLiabilities;
  const hasData          = total > 0;
  const assetPct         = hasData ? Math.round((totalAssets / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 shadow-sm">
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Net Worth</p>

      {/* Big number + trend */}
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className={`text-4xl font-bold tracking-tight leading-none ${isPositive ? 'text-gray-900' : 'text-rose-600'}`}>
          {formatINRCompact(netWorth)}
        </p>
        {hasData && (
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">
              {assetPct}% in assets
            </span>
          </div>
        )}
      </div>

      {/* Assets • Liabilities inline */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <span className="text-gray-400">Assets</span>
        <span className="font-semibold text-emerald-600">{formatINR(totalAssets)}</span>
        <span className="text-gray-200">•</span>
        <span className="text-gray-400">Liabilities</span>
        <span className="font-semibold text-rose-500">{formatINR(totalLiabilities)}</span>
      </div>

      {/* Thin progress bar — only when there's actual data to show */}
      <div className="mt-3">
        {hasData ? (
          <>
            <div className="flex h-[5px] w-full overflow-hidden rounded-full bg-gray-100">
              <div className="bg-emerald-500 transition-all" style={{ width: `${assetPct}%` }} />
              <div className="bg-rose-400 transition-all" style={{ width: `${100 - assetPct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>{assetPct}% assets</span>
              <span>{100 - assetPct}% liabilities</span>
            </div>
          </>
        ) : (
          <>
            <div className="h-[5px] w-full rounded-full bg-gray-100" />
            <p className="mt-1.5 text-xs text-gray-400 text-center">
              Add assets &amp; liabilities to see your breakdown
            </p>
          </>
        )}
      </div>
    </div>
  );
}
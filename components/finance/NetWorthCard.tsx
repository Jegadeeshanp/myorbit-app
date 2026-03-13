'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/financeStore';

export default function NetWorthCard() {
  const { state } = useFinance();
  const { assets, liabilities } = state;

  const totalAssets = useMemo(() => assets.reduce((sum, asset) => sum + asset.value, 0), [assets]);
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, liab) => sum + liab.outstanding, 0),
    [liabilities]
  );

  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-emerald-50 to-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-gray-700">Net worth</div>
        <div className="text-3xl font-semibold text-emerald-600">{netWorth.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
        <div className="text-xs text-emerald-500">▲ +4.2% this month</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assets</div>
          <div className="mt-1 text-lg font-semibold text-emerald-600">
            {totalAssets.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Liabilities</div>
          <div className="mt-1 text-lg font-semibold text-red-500">
            {totalLiabilities.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </div>
        </div>
      </div>
    </div>
  );
}

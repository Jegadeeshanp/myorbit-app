'use client';

import { Check, Zap } from 'lucide-react';

const USAGE = [
  { label: 'Assets',      used: 4,  limit: 5  },
  { label: 'Liabilities', used: 3,  limit: 5  },
  { label: 'Goals',       used: 0,  limit: 3  },
  { label: 'Snapshots',   used: 2,  limit: 10 },
];

const PRO_FEATURES = [
  'Unlimited assets & liabilities',
  'Net worth tracking & history',
  'Income & expense insights',
  'Import from broker / CSV',
  'Auto-refresh asset prices',
  'Multi-currency support',
  'Family profiles',
  'Share with up to 5 people',
  'Priority support',
];

export default function SubscriptionTab() {
  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Current Plan</h2>
            <p className="text-xs text-gray-500 mt-0.5">Free forever</p>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Free</span>
        </div>

        <div className="space-y-4">
          {USAGE.map(u => {
            const pct = Math.round((u.used / u.limit) * 100);
            const warn = pct >= 80;
            return (
              <div key={u.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{u.label}</span>
                  <span className={warn ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                    {u.used} / {u.limit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full transition-all ${warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade card */}
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-green-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-emerald-200" />
          <h2 className="text-lg font-bold">Upgrade to Pro</h2>
        </div>
        <p className="text-sm text-emerald-100 mb-6">Everything you need to manage your wealth.</p>

        <div className="grid grid-cols-1 gap-2 mb-8 sm:grid-cols-2">
          {PRO_FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2">
              <div className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-400/30">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm text-emerald-50">{f}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white/10 p-4 mb-5 text-center">
          <p className="text-xs text-emerald-200 uppercase tracking-widest mb-1">Lifetime Access</p>
          <p className="text-3xl font-bold">₹899</p>
          <p className="text-xs text-emerald-200 mt-1">One-time payment · No subscription</p>
        </div>

        <button className="w-full rounded-full bg-white py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

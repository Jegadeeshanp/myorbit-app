'use client';

import Link from 'next/link';
import { Plus, Minus, ArrowLeftRight, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { label: 'Add Expense',  href: '/orbit/finance/transactions/add',          icon: Minus,           bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100' },
  { label: 'Add Income',   href: '/orbit/finance/transactions/add?type=income', icon: Plus,          bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { label: 'Transfer',     href: '/orbit/finance/transactions/add?type=transfer', icon: ArrowLeftRight, bg: 'bg-blue-50', text: 'text-blue-600',    border: 'border-blue-100' },
  { label: 'Add Asset',    href: '/orbit/finance/assets',                    icon: TrendingUp,      bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100' },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(a => (
          <Link key={a.label} href={a.href} className={`flex flex-col items-center gap-2 rounded-xl border ${a.border} ${a.bg} px-2 py-3 transition hover:opacity-80`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm`}>
              <a.icon className={`h-4 w-4 ${a.text}`} />
            </div>
            <span className={`text-center text-xs font-medium ${a.text}`}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

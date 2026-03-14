'use client';

import { Account } from '@/lib/financeStore';
import { Landmark, CreditCard, Wallet, Banknote } from 'lucide-react';

function fmt(value: number) {
  return Math.abs(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

const TYPE_CONFIG: Record<Account['type'], { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  Bank: {
    icon: <Landmark className="h-4 w-4" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    label: 'Savings Account',
  },
  'Credit Card': {
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    label: 'Credit Card',
  },
  'Debit Card': {
    icon: <CreditCard className="h-4 w-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    label: 'Debit Card',
  },
  Cash: {
    icon: <Banknote className="h-4 w-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    label: 'Cash',
  },
  Wallet: {
    icon: <Wallet className="h-4 w-4" />,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    label: 'Wallet',
  },
};

export default function AccountCard({ account }: { account: Account }) {
  const config = TYPE_CONFIG[account.type] ?? TYPE_CONFIG['Bank'];
  const isNegative = account.balance < 0;
  const isCredit = account.type === 'Credit Card';

  // Simulated credit limit for credit cards (3x outstanding as placeholder)
  const creditLimit = isCredit ? Math.abs(account.balance) * 1.5 : 0;
  const utilization = isCredit ? Math.round((Math.abs(account.balance) / creditLimit) * 100) : 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
          {config.icon}
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
          {account.type}
        </span>
      </div>

      {/* Account name */}
      <div className="mt-4">
        <p className="text-sm text-gray-500">{config.label}</p>
        <h3 className="mt-0.5 text-base font-semibold text-gray-900 truncate">{account.name}</h3>
      </div>

      {/* Balance */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Balance</p>
          <p className={`mt-0.5 text-2xl font-bold tracking-tight ${isNegative ? 'text-rose-600' : 'text-gray-900'}`}>
            {isNegative ? '-' : ''}{fmt(account.balance)}
          </p>
        </div>

        {isCredit && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Utilization</p>
            <p className={`text-sm font-semibold ${utilization > 70 ? 'text-rose-600' : 'text-amber-600'}`}>
              {utilization}%
            </p>
          </div>
        )}
      </div>

      {/* Credit utilization bar */}
      {isCredit && (
        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full transition-all ${utilization > 70 ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>Used {fmt(Math.abs(account.balance))}</span>
            <span>Limit {fmt(creditLimit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

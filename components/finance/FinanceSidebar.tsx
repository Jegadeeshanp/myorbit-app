'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  ArrowRightLeft,
  TrendingUp,
  CreditCard,
  Wallet,
  BarChart3,
} from 'lucide-react';

const menu = [
  { label: 'Overview', href: '/orbit/finance', Icon: LayoutDashboard },
  { label: 'Accounts', href: '/orbit/finance/accounts', Icon: Landmark },
  { label: 'Transactions', href: '/orbit/finance/transactions', Icon: ArrowRightLeft },
  { label: 'Assets', href: '/orbit/finance/assets', Icon: TrendingUp },
  { label: 'Liabilities', href: '/orbit/finance/liabilities', Icon: CreditCard },
  { label: 'Budget', href: '/orbit/finance/budget', Icon: Wallet },
  { label: 'Insights', href: '/orbit/finance/insights', Icon: BarChart3 },
];

export default function FinanceSidebar() {
  const pathname = usePathname();

  const active = useMemo(() => {
    if (!pathname) return '';
    const match = menu.find((item) => item.href === pathname);
    if (match) return match.href;
    if (pathname.startsWith('/orbit/finance/') && pathname !== '/orbit/finance') {
      return pathname;
    }
    return '/orbit/finance';
  }, [pathname]);

  return (
    <aside className="h-full w-60 flex-none border-r border-white/40 bg-white/50 px-4 py-10 backdrop-blur">
      <div className="mb-10">
        <div className="text-lg font-semibold text-gray-900">Finance</div>
        <div className="mt-1 text-sm text-gray-500">Personal dashboard</div>
      </div>

      <nav className="space-y-1">
        {menu.map((item) => {
          const isActive = active === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={isActive ? 'h-4 w-4 text-white' : 'h-4 w-4 text-gray-600 group-hover:text-gray-900'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-green-50 p-4 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">Need help?</div>
        <p className="mt-1">Reach out to support or explore the help center.</p>
      </div>
    </aside>
  );
}

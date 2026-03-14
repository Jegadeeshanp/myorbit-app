'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Landmark, ArrowRightLeft,
  TrendingUp, CreditCard, Wallet, BarChart3,
} from 'lucide-react';

const menu = [
  { label: 'Overview',     href: '/orbit/finance',              Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/orbit/finance/accounts',     Icon: Landmark },
  { label: 'Transactions', href: '/orbit/finance/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/orbit/finance/assets',       Icon: TrendingUp },
  { label: 'Liabilities',  href: '/orbit/finance/liabilities',  Icon: CreditCard },
  { label: 'Budget',       href: '/orbit/finance/budget',       Icon: Wallet },
  { label: 'Insights',     href: '/orbit/finance/insights',     Icon: BarChart3 },
];

export default function FinanceSidebar() {
  const pathname = usePathname();

  const active = useMemo(() => {
    if (!pathname) return '';
    const match = menu.find(item => item.href === pathname);
    if (match) return match.href;
    if (pathname.startsWith('/orbit/finance/') && pathname !== '/orbit/finance') return pathname;
    return '/orbit/finance';
  }, [pathname]);

  return (
    /* hidden on mobile (md:flex), visible on desktop */
    <aside className="hidden md:flex h-full w-56 flex-none flex-col border-r border-white/40 bg-white/50 px-3 py-8 backdrop-blur">
      <div className="mb-8 px-3">
        <div className="text-base font-semibold text-gray-900">Finance</div>
        <div className="mt-0.5 text-xs text-gray-500">Personal dashboard</div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-emerald-50 p-3 text-xs text-gray-600">
        <p className="font-semibold text-gray-800">Need help?</p>
        <p className="mt-0.5 text-gray-500">Explore the help center.</p>
      </div>
    </aside>
  );
}

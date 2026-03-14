'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Landmark, ArrowRightLeft, TrendingUp, Wallet } from 'lucide-react';

const NAV = [
  { label: 'Overview',     href: '/orbit/finance',              Icon: LayoutDashboard },
  { label: 'Accounts',     href: '/orbit/finance/accounts',     Icon: Landmark },
  { label: 'Transactions', href: '/orbit/finance/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/orbit/finance/assets',       Icon: TrendingUp },
  { label: 'Budget',       href: '/orbit/finance/budget',       Icon: Wallet },
];

export default function MobileNav() {
  const pathname = usePathname() ?? '';

  const active = NAV.find(n => n.href === pathname)?.href
    ?? (pathname.startsWith('/orbit/finance') ? '/orbit/finance' : '');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      {/* Safe area for iPhone home indicator */}
      <div className="flex items-center justify-around px-1 pb-safe pt-1">
        {NAV.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

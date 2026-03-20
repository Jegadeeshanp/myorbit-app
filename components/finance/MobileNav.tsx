'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, ArrowRightLeft, TrendingUp,
  Landmark, Wallet, CreditCard, BarChart3,
  MoreHorizontal, Settings, X,
} from 'lucide-react';

const PRIMARY = [
  { label: 'Overview',     href: '/orbit/finance',              Icon: LayoutDashboard },
  { label: 'Transactions', href: '/orbit/finance/transactions', Icon: ArrowRightLeft },
  { label: 'Assets',       href: '/orbit/finance/assets',       Icon: TrendingUp },
];

const MORE = [
  { label: 'Accounts',    href: '/orbit/finance/accounts',    Icon: Landmark },
  { label: 'Budget',      href: '/orbit/finance/budget',      Icon: Wallet },
  { label: 'Liabilities', href: '/orbit/finance/liabilities', Icon: CreditCard },
  { label: 'Vitals',    href: '/orbit/finance/vitals',    Icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const allNav = [...PRIMARY, ...MORE];
  const active = allNav.find(n => n.href === pathname)?.href
    ?? (pathname.startsWith('/orbit/finance') ? '/orbit/finance' : '');

  const isMoreActive = MORE.some(n => active === n.href);
  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md md:hidden">
        <div className="flex items-center px-1 pb-safe pt-1">
          {PRIMARY.map(({ label, href, Icon }) => {
            const isActive = active === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition ${isMoreActive ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isMoreActive ? 'bg-emerald-50' : ''}`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-2xl bg-white shadow-2xl overflow-y-auto" style={{ maxHeight: '65vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-sm font-semibold text-gray-900">More</p>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="px-3 pb-2 space-y-0.5">
              {MORE.map(({ label, href, Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === href ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <Icon className={`h-4 w-4 flex-none ${active === href ? 'text-emerald-600' : 'text-gray-400'}`} />
                  {label}
                </Link>
              ))}
            </div>
            <div className="mx-4 border-t border-gray-100" />
            <div className="px-3 pt-3 pb-6 space-y-0.5">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">{initials}</div>
                <p className="text-sm font-medium text-gray-900">{userName}</p>
              </div>
              <Link href="/orbit/finance/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <Settings className="h-4 w-4 flex-none text-gray-400" />
                Finance Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
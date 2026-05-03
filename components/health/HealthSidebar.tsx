'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Heart, LayoutDashboard, Dumbbell,
  UtensilsCrossed, Settings, User, RefreshCw,
} from 'lucide-react';

const menu = [
  { label: 'Dashboard', href: '/orbit/health',           Icon: LayoutDashboard },
  { label: 'Workouts',  href: '/orbit/health/workouts',  Icon: Dumbbell },
  { label: 'Nutrition', href: '/orbit/health/nutrition', Icon: UtensilsCrossed },
  { label: 'Sync',      href: '/orbit/health/sync',      Icon: RefreshCw },
];

export default function HealthSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = useMemo(() => {
    if (!pathname) return '/orbit/health';
    const exact = menu.find(m => m.href === pathname);
    if (exact) return exact.href;
    const prefix = menu.find(m => pathname.startsWith(m.href) && m.href !== '/orbit/health');
    if (prefix) return prefix.href;
    return '/orbit/health';
  }, [pathname]);

  const userName = session?.user?.name ?? 'User';
  const initials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 flex-none flex-col overflow-y-auto border-r border-gray-100 bg-white px-3 py-5 md:flex">
      <div className="mb-5 px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Health</div>
            <div className="text-[11px] text-gray-400">Wellness tracker</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-gray-100" />

      <div className="mt-3 space-y-0.5">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
            {initials || <User className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 leading-none">{userName}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-400">Personal account</p>
          </div>
        </div>

        <Link
          href="/orbit/health/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 flex-none text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

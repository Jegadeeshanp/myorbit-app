'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Flame, Timer, CalendarClock, ArrowLeft, Settings, User } from 'lucide-react';

const menu = [
  { label: 'Dashboard',   href: '/orbit/habits',             Icon: LayoutDashboard },
  { label: 'Streaks',     href: '/orbit/habits/streaks',     Icon: Flame },
  { label: 'Focus Timer', href: '/orbit/habits/focus',       Icon: Timer },
  { label: 'Countdowns',  href: '/orbit/habits/countdowns',  Icon: CalendarClock },
];

export default function HabitsSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = useMemo(() => {
    if (!pathname) return '/orbit/habits';
    const exact = menu.find(m => m.href === pathname);
    if (exact) return exact.href;
    const prefix = menu.find(m => pathname.startsWith(m.href) && m.href !== '/orbit/habits');
    if (prefix) return prefix.href;
    return '/orbit/habits';
  }, [pathname]);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-56 flex-none flex-col border-r border-white/40 bg-white/50 px-3 py-6 backdrop-blur overflow-y-auto">
      {/* Brand */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white text-xs">
            🔥
          </div>
          <div className="text-base font-semibold text-gray-900">Habits</div>
        </div>
        <div className="mt-0.5 text-xs text-gray-500 pl-9">Behavioral engine</div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-white' : 'text-gray-500'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-gray-100" />

      <div className="mt-3 space-y-0.5">
        <Link href="/orbit" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 flex-none text-gray-500" />
          My Orbit
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white select-none">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 leading-none">{userName}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">Personal account</p>
          </div>
        </div>
        <Link href="/orbit/habits/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
          <Settings className="h-4 w-4 flex-none text-gray-500" />
          Habits Settings
        </Link>
      </div>
    </aside>
  );
}

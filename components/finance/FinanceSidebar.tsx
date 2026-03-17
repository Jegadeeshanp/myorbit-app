'use client';

import Link from 'next/link';
import { useMemo, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, Landmark, ArrowRightLeft,
  TrendingUp, CreditCard, Wallet, BarChart3,
  Smartphone, Settings, LogOut, User,
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
  const router   = useRouter();
  const { data: session } = useSession();
  const installPromptRef = useRef<Event & { prompt: () => Promise<void> } | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e as Event & { prompt: () => Promise<void> };
      setInstallVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptRef.current) return;
    await installPromptRef.current.prompt();
    installPromptRef.current = null;
    setInstallVisible(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/signin');
  };

  const active = useMemo(() => {
    if (!pathname) return '';
    const match = menu.find(item => item.href === pathname);
    if (match) return match.href;
    if (pathname.startsWith('/orbit/finance/') && pathname !== '/orbit/finance') return pathname;
    return '/orbit/finance';
  }, [pathname]);

  // Derive initials for avatar
  const userName  = session?.user?.name ?? 'User';
  const initials  = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-56 flex-none flex-col border-r border-white/40 bg-white/50 px-3 py-6 backdrop-blur overflow-y-auto">

      {/* ── Brand / section header ─── */}
      <div className="mb-6 px-3">
        <div className="text-base font-semibold text-gray-900">Finance</div>
        <div className="mt-0.5 text-xs text-gray-500">Personal dashboard</div>
      </div>

      {/* ── Navigation ─── */}
      <nav className="flex-1 space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-white' : 'text-gray-500'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Install App — shown when PWA prompt is available ─── */}
      {installVisible && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 w-full"
        >
          <Smartphone className="h-4 w-4 flex-none text-gray-500" />
          Install App
        </button>
      )}

      {/* ── Divider ─── */}
      <div className="mt-4 border-t border-gray-100" />

      {/* ── User profile + actions ─── */}
      <div className="mt-3 space-y-0.5">

        {/* User card */}
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white select-none">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 leading-none">{userName}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">Personal account</p>
          </div>
        </div>

        {/* Settings */}
        <Link
          href="/orbit/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 flex-none text-gray-500" />
          Settings
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4 flex-none text-gray-500" />
          Logout
        </button>

      </div>
    </aside>
  );
}

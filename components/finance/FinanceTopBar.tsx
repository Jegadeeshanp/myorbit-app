'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/orbit/finance':              'Overview',
  '/orbit/finance/accounts':     'Accounts',
  '/orbit/finance/transactions': 'Transactions',
  '/orbit/finance/assets':       'Assets',
  '/orbit/finance/liabilities':  'Liabilities',
  '/orbit/finance/budget':       'Budget',
  '/orbit/finance/insights':     'Insights',
};

const PAGE_SUBTITLES: Record<string, string> = {
  '/orbit/finance':              'Your personal money command center — manage and control finances with clarity.',
  '/orbit/finance/accounts':     'Track your bank accounts, wallets, and credit cards in one place.',
  '/orbit/finance/transactions': 'All income and expenses recorded in one place.',
  '/orbit/finance/assets':       'Keep tabs on your investments and asset allocation.',
  '/orbit/finance/liabilities':  'Keep an eye on loans, credit, and monthly obligations.',
  '/orbit/finance/budget':       'Follow your monthly spending plan and stay on track.',
  '/orbit/finance/insights':     'Financial insights based on your activity and trends.',
};

export default function FinanceTopBar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const title    = PAGE_TITLES[pathname] ?? null;
  const subtitle = PAGE_SUBTITLES[pathname] ?? null;

  return (
    <div className="mb-1 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
      {/* Left: title + subtitle stacked */}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-xl font-semibold text-gray-900">{title}</h1>}
        {subtitle && <p className="mt-0.5 hidden text-sm text-gray-500 sm:block">{subtitle}</p>}
      </div>

      {/* Right: action + MyOrbit logo badge */}
      <div className="flex flex-none items-center gap-2">
        {action}
        <Link
          href="/orbit"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition hover:bg-gray-100"
        >
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold leading-none shadow-sm">
            ⭑
          </div>
          <span className="text-base font-semibold text-gray-800">MyOrbit</span>
        </Link>
      </div>
    </div>
  );
}
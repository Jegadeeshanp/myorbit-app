'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

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
  const subtitle = PAGE_SUBTITLES[pathname] ?? null;

  return (
    <div className="mb-1 flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
      {/* Left: subtitle — hidden on mobile to save space */}
      {subtitle ? (
        <p className="hidden text-sm text-gray-500 sm:block">{subtitle}</p>
      ) : (
        <div />
      )}

      {/* Right: action + My Orbit (My Orbit hidden on mobile — use back gesture) */}
      <div className="flex flex-none items-center gap-2 ml-auto">
        {action}
        <Link href="/orbit"
          className="hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex">
          <ArrowLeft className="h-4 w-4" />
          My Orbit
        </Link>
      </div>
    </div>
  );
}

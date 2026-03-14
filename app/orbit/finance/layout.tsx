import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import { FinanceProvider } from '@/lib/financeStore';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
        <div className="mx-auto flex min-h-screen max-w-7xl">
          <FinanceSidebar />

          <div className="flex-1 p-8">
            <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg text-gray-600">
                  Your personal money command center — manage and control finances with clarity.
                </p>
              </div>
              <Link
                href="/orbit"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                My Orbit
              </Link>
            </header>

            <div className="space-y-10">{children}</div>
          </div>
        </div>
      </div>
    </FinanceProvider>
  );
}

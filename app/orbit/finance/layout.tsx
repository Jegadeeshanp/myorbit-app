import type { ReactNode } from 'react';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import { FinanceProvider } from '@/lib/financeStore';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
        <div className="mx-auto flex min-h-screen max-w-7xl">
          <FinanceSidebar />

          <div className="flex-1 p-8">
            <header className="mb-8">
              <p className="text-lg text-gray-600">
                Your personal money command center — manage and control finances with clarity.
              </p>
            </header>

            <div className="space-y-10">{children}</div>
          </div>
        </div>
      </div>
    </FinanceProvider>
  );
}

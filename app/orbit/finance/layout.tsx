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
            <div className="space-y-8">{children}</div>
          </div>
        </div>
      </div>
    </FinanceProvider>
  );
}

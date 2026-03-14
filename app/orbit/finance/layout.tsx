import type { ReactNode } from 'react';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import MobileNav from '@/components/finance/MobileNav';
import { FinanceProvider } from '@/lib/financeStore';
import ToastContainer from '@/components/Toast';

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
        <div className="mx-auto flex min-h-screen max-w-7xl">
          {/* Sidebar — desktop only */}
          <FinanceSidebar />

          {/* Main content — full width on mobile, flex-1 on desktop */}
          <div className="flex-1 overflow-x-hidden px-4 pb-24 pt-5 md:p-8 md:pb-8">
            <div className="space-y-5">{children}</div>
          </div>
        </div>

        {/* Bottom nav — mobile only */}
        <MobileNav />
        <ToastContainer />
      </div>
    </FinanceProvider>
  );
}

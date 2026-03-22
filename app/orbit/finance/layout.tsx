import type { ReactNode } from 'react';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import MobileNav from '@/components/finance/MobileNav';
import ToastContainer from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import FinanceFAB from '@/components/finance/FinanceFAB';
import AiTransactionButton from '@/components/AiTransactionButton';
// FinanceProvider is already provided by app/orbit/layout.tsx → OrbitClientWrapper
// Do NOT add another FinanceProvider here — it would create a nested duplicate
// causing double API calls on every finance page load.

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
      <div className="flex min-h-screen w-full">
        {/* Sidebar — desktop only */}
        <FinanceSidebar />

        {/* Main content — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 overflow-x-hidden px-4 pb-24 pt-5 md:p-8 md:pb-8">
          <ErrorBoundary>
            <div className="space-y-5">{children}</div>
          </ErrorBoundary>
        </div>
      </div>

      {/* AI Transaction Button — stacked above FinanceFAB */}
      <AiTransactionButton fabClassName="bottom-40 right-5 md:bottom-24 md:right-8" />

      {/* Floating Action Button — all finance pages */}
      <FinanceFAB />

      {/* Bottom nav — mobile only */}
      <MobileNav />
      <ToastContainer />
    </div>
  );
}

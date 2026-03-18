import type { ReactNode } from 'react';
import FinanceSidebar from '@/components/money/FinanceSidebar';
import MobileNav from '@/components/money/MobileNav';
import ToastContainer from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import FinanceFAB from '@/components/money/FinanceFAB';
// FinanceProvider is already provided by app/orbit/layout.tsx → OrbitClientWrapper
// Do NOT add another FinanceProvider here — it would create a nested duplicate
// causing double API calls on every finance page load.

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar — desktop only */}
        <FinanceSidebar />

        {/* Main content — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 overflow-x-hidden px-4 pb-24 pt-5 md:p-8 md:pb-8">
          <ErrorBoundary>
            <div className="space-y-5">{children}</div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Floating Action Button — all finance pages */}
      <FinanceFAB />

      {/* Bottom nav — mobile only */}
      <MobileNav />
      <ToastContainer />
    </div>
  );
}

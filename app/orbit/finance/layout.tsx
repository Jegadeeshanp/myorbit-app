import type { ReactNode } from 'react';
import FinanceSidebar from '@/components/finance/FinanceSidebar';
import MobileNav from '@/components/finance/MobileNav';
import ToastContainer from '@/components/Toast';

// FinanceProvider is already mounted in OrbitClientWrapper (wraps all orbit pages).
// Do not add it here — that would cause double API calls on every finance page load.
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#090d16] text-gray-900 dark:text-gray-100">
      <div className="flex min-h-screen w-full">
        {/* Sidebar — desktop only */}
        <FinanceSidebar />

        {/* Main content — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 overflow-x-hidden px-4 pb-28 pt-5 md:p-8 md:pb-8">
          <div className="space-y-5">{children}</div>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileNav />
      <ToastContainer />
    </div>
  );
}

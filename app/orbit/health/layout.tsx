import { HealthProvider } from '@/lib/healthStore';
import HealthSidebar from '@/components/health/HealthSidebar';
import HealthTopBar from '@/components/health/HealthTopBar';
import HealthFAB from '@/components/health/HealthFAB';
import HealthMobileNav from '@/components/health/HealthMobileNav';
import ToastContainer from '@/components/Toast';

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <HealthProvider>
      <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#090d16]">
        <div className="flex min-h-screen w-full">
          {/* Sidebar — desktop only */}
          <HealthSidebar />

          {/* Main content */}
          <div className="flex flex-1 flex-col min-w-0">
            <HealthTopBar />
            <main className="flex-1 px-4 py-6 sm:px-6 pb-28 md:pb-8">
              {children}
            </main>
          </div>
        </div>

        <HealthFAB />
        {/* Bottom nav — mobile only */}
        <HealthMobileNav />
        <ToastContainer />
      </div>
    </HealthProvider>
  );
}

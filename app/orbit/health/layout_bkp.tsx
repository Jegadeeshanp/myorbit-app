import HealthSidebar from '@/components/health/HealthSidebar';
import HealthTopBar from '@/components/health/HealthTopBar';
import ToastContainer from '@/components/Toast';

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <HealthSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <HealthTopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

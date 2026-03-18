import InsightsSidebar from '@/components/reflect/InsightsSidebar';
import InsightsTopBar from '@/components/reflect/InsightsTopBar';
import ToastContainer from '@/components/Toast';

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <InsightsSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InsightsTopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

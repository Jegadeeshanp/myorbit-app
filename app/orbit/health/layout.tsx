import HealthSidebar from '@/components/health/HealthSidebar';

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <HealthSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

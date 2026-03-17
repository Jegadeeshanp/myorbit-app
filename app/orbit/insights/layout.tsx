import InsightsSidebar from '@/components/insights/InsightsSidebar';

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <InsightsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

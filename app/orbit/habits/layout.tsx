import HabitsSidebar from '@/components/habits/HabitsSidebar';

export default function HabitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <HabitsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

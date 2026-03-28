import HabitsSidebar from '@/components/habits/HabitsSidebar';
import HabitsTopBar from '@/components/habits/HabitsTopBar';
import HabitsMobileNav from '@/components/habits/HabitsMobileNav';
import ToastContainer from '@/components/Toast';

export default function HabitsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <HabitsSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <HabitsTopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <HabitsMobileNav />
      <ToastContainer />
    </div>
  );
}

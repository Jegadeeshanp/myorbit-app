import GoalsSidebar from '@/components/goals/GoalsSidebar';
import GoalsTopBar from '@/components/goals/GoalsTopBar';
import MobileGoalsNav from '@/components/goals/MobileGoalsNav';
import ToastContainer from '@/components/Toast';

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <GoalsSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <GoalsTopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <MobileGoalsNav />
      <ToastContainer />
    </div>
  );
}

import ToastContainer from '@/components/Toast';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#090d16]">
      {children}
      <ToastContainer />
    </div>
  );
}
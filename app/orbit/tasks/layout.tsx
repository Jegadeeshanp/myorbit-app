import ToastContainer from '@/components/Toast';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {children}
      <ToastContainer />
    </div>
  );
}

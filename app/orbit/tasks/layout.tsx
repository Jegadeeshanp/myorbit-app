import ToastContainer from '@/components/Toast';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
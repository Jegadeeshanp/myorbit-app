import Link from 'next/link';
import ToastContainer from '@/components/Toast';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Module top bar — MyOrbit badge at top right, visible on mobile */}
      <header className="flex items-center justify-end px-4 py-3 border-b border-gray-100 md:hidden">
        <Link
          href="/orbit"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition hover:bg-gray-100"
        >
          <div className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-emerald-500 text-white text-[10px] font-bold leading-none">
            ⭑
          </div>
          <span className="font-semibold text-gray-700">MyOrbit</span>
        </Link>
      </header>
      {children}
      <ToastContainer />
    </div>
  );
}

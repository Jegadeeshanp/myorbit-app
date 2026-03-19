import Link from 'next/link';
import ToastContainer from '@/components/Toast';

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#12161D] text-white">
      <header className="flex items-center justify-end border-b border-white/10 px-4 py-3 md:hidden">
        <Link
          href="/orbit"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white"
        >
          <div className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-emerald-600 text-white text-[10px] font-bold leading-none">
            ★
          </div>
          <span className="font-semibold text-white">MyOrbit</span>
        </Link>
      </header>
      {children}
      <ToastContainer />
    </div>
  );
}

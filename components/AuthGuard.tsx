'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [auth.status, router]);

  if (auth.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading your orbit…</p>
        </div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') return null;

  return <>{children}</>;
}

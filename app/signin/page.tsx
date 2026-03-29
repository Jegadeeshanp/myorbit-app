'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authStore';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      window.location.href = '/orbit';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-9 shadow-lg shadow-emerald-200/40">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-sm text-lg">
            ⭑
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-gray-900">Sign in to MyOrbit</h1>
          <p className="mt-2 text-sm text-gray-600">Access your dashboard and track your finances.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-900">Create one</Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

// ── Inner component that reads search params ─────────────────────────────────
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus]           = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]       = useState('');

  // Redirect if no token present
  useEffect(() => {
    if (!token) {
      router.replace('/forgot-password');
    }
  }, [token, router]);

  const strength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8)  score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Password updated!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your password has been changed successfully. Sign in with your new password.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-block rounded-full bg-gray-900 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Set new password</h1>
        <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            New password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength meter */}
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= strength ? strengthColor : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{strengthLabel}</span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Confirm password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirm.length > 0 && password !== confirm && (
            <p className="mt-1 text-xs text-rose-500">Passwords do not match.</p>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-rose-500" />
            <p className="text-sm text-rose-600">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 disabled:opacity-60"
        >
          {status === 'loading' ? 'Updating password…' : 'Reset password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{' '}
        <Link href="/signin" className="font-medium text-gray-900 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

// ── Page wrapper with Suspense (required for useSearchParams in App Router) ──
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
        <Suspense fallback={<div className="text-center text-sm text-gray-400">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

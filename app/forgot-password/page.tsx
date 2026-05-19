'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email,          setEmail]          = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      setResendCooldown(30);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success — don't reveal whether email exists
      if (res.ok || res.status === 404) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-9 shadow-lg shadow-emerald-200/40">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto block h-12 w-12">
            <img src="/icons/app-logo.svg" alt="MyOrbit" className="h-12 w-12" />
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Check your inbox</h2>
            <p className="mt-2 text-sm text-gray-600">
              A reset link was sent to{' '}
              <span className="font-semibold text-gray-800">{email}</span>
            </p>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm space-y-1.5">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-14 flex-none text-xs text-gray-400">From</span>
                <span className="font-medium text-gray-800">noreply@myorbit.app</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-14 flex-none text-xs text-gray-400">Arrives</span>
                <span>Usually within 2 minutes</span>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
              <span className="mt-0.5 flex-none">⚠️</span>
              <p>Check your <strong>spam or junk folder</strong> if you don&apos;t see it in a few minutes.</p>
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="mt-5 w-full rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendLoading
                ? 'Resending…'
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend email'}
            </button>

            <Link
              href="/signin"
              className="mt-3 inline-block w-full rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center">
              <Link href="/signin" className="text-sm text-emerald-600 hover:text-emerald-800">
                ← Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

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
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Check your inbox</h2>
            <p className="mt-2 text-sm text-gray-600">
              If <span className="font-medium text-gray-800">{email}</span> is registered,
              you&apos;ll receive a reset link within a few minutes.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button onClick={() => setSubmitted(false)} className="text-emerald-600 underline">
                try again
              </button>.
            </p>
            <Link href="/signin"
              className="mt-6 inline-block rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
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

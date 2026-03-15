// app/contact/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — replace with your actual email/form API
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-base font-bold text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white text-sm">
              ⭑
            </span>
            MyOrbit
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900">Contact us</h1>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;d love to hear from you. Send us a message and we&apos;ll respond within 2 business days.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact info */}
          <div className="space-y-6 lg:col-span-1">
            {[
              {
                label: 'General enquiries',
                value: 'hello@myorbit.app',
                href: 'mailto:hello@myorbit.app',
              },
              {
                label: 'Privacy & data',
                value: 'privacy@myorbit.app',
                href: 'mailto:privacy@myorbit.app',
              },
              {
                label: 'Legal',
                value: 'legal@myorbit.app',
                href: 'mailto:legal@myorbit.app',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {item.label}
                </p>
                <a
                  href={item.href}
                  className="mt-1 block text-sm font-medium text-emerald-600 hover:underline"
                >
                  {item.value}
                </a>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Message sent</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Thanks for reaching out. We&apos;ll get back to you within 2 business days.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-6 text-sm font-medium text-emerald-600 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Rahul Sharma"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="rahul@example.com"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Subject
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General question</option>
                      <option value="bug">Report a bug</option>
                      <option value="feature">Feature request</option>
                      <option value="privacy">Privacy or data request</option>
                      <option value="account">Account issue</option>
                      <option value="billing">Billing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us how we can help..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {loading ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-700">Terms of Service</Link>
          <Link href="/" className="hover:text-gray-700">Home</Link>
        </div>
      </div>
    </main>
  );
}

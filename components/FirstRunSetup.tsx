'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { X, ChevronRight, Check } from 'lucide-react';

const TIMEZONES = [
  { value: 'Asia/Kolkata',   label: 'India (IST, UTC+5:30)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London',  label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',   label: 'Paris (CET/CEST)' },
  { value: 'Asia/Dubai',     label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

const CURRENCIES = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'AED', label: 'د.إ UAE Dirham (AED)' },
];

const FOCUS_MODULES = [
  { id: 'finance',  emoji: '💰', label: 'Finance',  description: 'Track accounts, expenses & investments' },
  { id: 'goals',    emoji: '🎯', label: 'Goals',    description: 'Set targets and track your progress' },
  { id: 'health',   emoji: '❤️', label: 'Health',   description: 'Log sleep, workouts & daily wellness' },
  { id: 'tasks',    emoji: '✅', label: 'Tasks',    description: 'Capture tasks, projects & quick notes' },
  { id: 'habits',   emoji: '🔥', label: 'Habits',   description: 'Build routines and daily streaks' },
];

const FIRST_WIN: Record<string, { title: string; description: string; cta: string; href: string }> = {
  finance: {
    title: 'Add your first account',
    description: "Connect a bank account or wallet to see your net worth and spending at a glance.",
    cta: 'Go to Finance',
    href: '/orbit/finance',
  },
  goals: {
    title: 'Set your first goal',
    description: "Pick one thing you want to achieve — your career, fitness, savings, anything.",
    cta: 'Create a Goal',
    href: '/orbit/goals',
  },
  health: {
    title: "Log today's check-in",
    description: "Record your steps, sleep or mood. Just one entry starts your streak.",
    cta: 'Go to Health',
    href: '/orbit/health',
  },
  tasks: {
    title: "Capture what's on your mind",
    description: "Add your first task — anything nagging at you right now.",
    cta: 'Open Tasks',
    href: '/orbit/tasks',
  },
  habits: {
    title: 'Build your first habit',
    description: "Choose one small behaviour you want to do every day.",
    cta: 'Create a Habit',
    href: '/orbit/habits',
  },
};

interface Props {
  onComplete: () => void;
}

export default function FirstRunSetup({ onComplete }: Props) {
  const router = useRouter();
  const { auth } = useAuth();

  const [step, setStep]         = useState(1);
  const [name, setName]         = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [focus, setFocus]       = useState<string>('');
  const [saving, setSaving]     = useState(false);

  // Pre-fill name from session
  useEffect(() => {
    if (auth.status === 'authenticated') setName(auth.user.name);
  }, [auth]);

  const handleStep1Next = () => {
    if (name.trim().length < 2) return;
    setStep(2);
  };

  const handleFocusPick = (id: string) => {
    setFocus(id);
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           name.trim(),
          currency,
          onboardingDone: true,
          focusModule:    focus,
        }),
      });
    } catch { /* best-effort */ }
    onComplete();
    if (focus && FIRST_WIN[focus]) {
      router.push(FIRST_WIN[focus].href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all duration-300 ${
                n === step ? 'w-8 bg-emerald-600' : n < step ? 'w-2 bg-emerald-400' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* ─── Step 1: Tell us about you ─── */}
        {step === 1 && (
          <div className="px-8 pb-8 pt-4">
            <div className="mb-6 text-center">
              <div className="mb-3 text-5xl">👋</div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to MyOrbit</h2>
              <p className="mt-1.5 text-sm text-gray-500">Let's personalise your experience in 30 seconds.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleStep1Next}
              disabled={name.trim().length < 2}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>

            {/* Trust strip */}
            <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
              {[
                { icon: '🔒', text: 'AES-256 encrypted' },
                { icon: '🚫', text: 'Never sold' },
                { icon: '📤', text: 'Export anytime' },
              ].map(({ icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span>{icon}</span>
                  <span>{text}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 2: Pick your first focus ─── */}
        {step === 2 && (
          <div className="px-8 pb-8 pt-4">
            <div className="mb-6 text-center">
              <div className="mb-3 text-5xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900">Pick your first focus</h2>
              <p className="mt-1.5 text-sm text-gray-500">You can use all modules — this just sets your starting point.</p>
            </div>

            <div className="space-y-2">
              {FOCUS_MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleFocusPick(m.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50 group"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition" />
                </button>
              ))}
            </div>

            <button
              onClick={() => { setFocus(''); setStep(3); }}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Skip — I'll explore on my own
            </button>
          </div>
        )}

        {/* ─── Step 3: Your first win ─── */}
        {step === 3 && (
          <div className="px-8 pb-8 pt-4">
            <div className="mb-6 text-center">
              <div className="mb-3 text-5xl">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
              {focus && FIRST_WIN[focus] ? (
                <p className="mt-1.5 text-sm text-gray-500">
                  Here's your first step with <strong>{FOCUS_MODULES.find(m => m.id === focus)?.label}</strong>.
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-gray-500">
                  Your workspace is ready. Pick any module to get started.
                </p>
              )}
            </div>

            {focus && FIRST_WIN[focus] && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-base font-semibold text-emerald-900">{FIRST_WIN[focus].title}</p>
                <p className="mt-1 text-sm text-emerald-700">{FIRST_WIN[focus].description}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {focus && FIRST_WIN[focus] ? (
                  <>{FIRST_WIN[focus].cta} <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <><Check className="h-4 w-4" /> Go to my dashboard</>
                )}
              </button>

              {focus && (
                <button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await fetch('/api/settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name.trim(), currency, onboardingDone: true, focusModule: focus }),
                      });
                    } catch { /* best-effort */ }
                    setSaving(false);
                    onComplete();
                  }}
                  disabled={saving}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  Go to dashboard first
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

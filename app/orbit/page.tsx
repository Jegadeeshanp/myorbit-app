'use client';

import {
  Wallet, HeartPulse, Lightbulb,
  LogOut, Settings, Smartphone, X, Zap, Lock, MonitorSmartphone, Telescope,
} from 'lucide-react';
import Link from 'next/link';
import ModuleCard from '@/components/ModuleCard';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import OnboardingWizard from '@/components/OnboardingWizard';

const MODULES = [
  {
    id: 'money',
    title: 'Money',
    description: 'Track accounts, transactions, budgets and net worth.',
    icon: <Wallet className="h-6 w-6" />,
    href: '/orbit/money',
    enabled: true,
    cta: 'Manage Money →',
  },
  {
    id: 'do',
    title: 'Do',
    description: 'Tasks, goals, habits, focus timer and weekly plan.',
    icon: <Zap className="h-6 w-6" />,
    href: '/orbit/do',
    enabled: true,
    cta: 'Get Things Done →',
  },
  {
    id: 'body',
    title: 'Body',
    description: 'Track steps, sleep, workouts and daily health score.',
    icon: <HeartPulse className="h-6 w-6" />,
    href: '/orbit/body',
    enabled: true,
    cta: 'Track Wellness →',
  },
  {
    id: 'reflect',
    title: 'Reflect',
    description: 'Weekly review, cross-domain insights and AI summaries.',
    icon: <Telescope className="h-6 w-6" />,
    href: '/orbit/reflect',
    enabled: true,
    cta: 'Discover Insights →',
  },
];

// ── Install App popup ──────────────────────────────────────────────────────
function InstallModal({
  onClose,
  onInstall,
  canInstall,
}: {
  onClose: () => void;
  onInstall: () => void;
  canInstall: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl bg-[#1a1a2e] text-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold">Install App</p>
              <p className="text-xs text-gray-400">MyOrbit · Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-5 space-y-3">
          {[
            { icon: MonitorSmartphone, text: 'Opens instantly — no browser, no tabs' },
            { icon: Zap,              text: 'Faster loads with offline caching'       },
            { icon: Lock,             text: 'Same app, same data — nothing changes'   },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="h-4 w-4 flex-none text-emerald-400" />
              <p className="text-sm text-gray-200">{text}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-white/10" />

        {/* Instructions */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-gray-300">To install, use your browser menu:</p>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold">1</span>
            <p className="text-sm text-gray-200 pt-0.5">
              Tap the <span className="inline-flex items-center gap-0.5 font-semibold text-white">⋮</span> <span className="font-semibold text-white">menu</span> in your browser
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold">2</span>
            <p className="text-sm text-gray-200 pt-0.5">
              Tap <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white">⊞ Install app</span> or <span className="font-semibold text-white">Add to Home Screen</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 space-y-2">
          {canInstall && (
            <button
              onClick={onInstall}
              className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              Install Now
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-white/10 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/15"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Orbit() {
  const { auth, signOut } = useAuth();
  const router = useRouter();
  const { state } = useFinance();
  const installPromptRef = useRef<Event & { prompt: () => Promise<void> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e as Event & { prompt: () => Promise<void> };
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptRef.current) return;
    await installPromptRef.current.prompt();
    installPromptRef.current = null;
    setCanInstall(false);
    setInstallOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    router.push('/signin');
  };

  const userName = auth.status === 'authenticated' ? auth.user.name : '';

  const showWizardRef = useRef<boolean | null>(null);
  if (state.loadState === 'ready' && showWizardRef.current === null) {
    showWizardRef.current = state.accounts.length === 0 && state.assets.length === 0;
  }
  const showWizard = showWizardRef.current === true;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {showWizard && <OnboardingWizard onDismiss={() => { showWizardRef.current = false; }} />}

      {installOpen && (
        <InstallModal
          onClose={() => setInstallOpen(false)}
          onInstall={handleInstall}
          canInstall={canInstall}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white text-3xl shadow-sm">
            ⭑
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">MyOrbit</h1>
          {userName && (
            <p className="mt-2 text-base text-emerald-700 font-medium">Welcome back, {userName}</p>
          )}
          <p className="mt-1 text-base text-gray-600">Choose what you want to manage today.</p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <ModuleCard key={module.id} {...module} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {/* Install App — always visible, opens popup */}
          <button
            type="button"
            onClick={() => setInstallOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          >
            <Smartphone className="h-4 w-4" />
            Install App
          </button>

          <Link href="/orbit/settings" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}

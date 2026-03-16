'use client';

import { Wallet, Target, HeartPulse, CheckCircle, ClipboardList, Lightbulb, LogOut, Settings, Smartphone } from 'lucide-react';
import Link from 'next/link';
import ModuleCard from '@/components/ModuleCard';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import OnboardingWizard from '@/components/OnboardingWizard';

const MODULES = [
  {
    id: 'finance',
    title: 'Finance',
    description: 'Track accounts, expenses, investments and budgets.',
    icon: <Wallet className="h-6 w-6" />,
    href: '/orbit/finance',
    enabled: true,
    cta: 'Manage Money →',
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Set and track personal targets with progress tracking.',
    icon: <Target className="h-6 w-6" />,
    enabled: false,
    cta: 'Start Achieving →',
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Track workouts, wellness, and daily habits.',
    icon: <HeartPulse className="h-6 w-6" />,
    enabled: false,
    cta: 'Start Tracking →',
  },
  {
    id: 'habits',
    title: 'Habits',
    description: 'Build positive routines with streaks and reminders.',
    icon: <CheckCircle className="h-6 w-6" />,
    enabled: false,
    cta: 'Build Streaks →',
  },
  {
    id: 'todo',
    title: 'To-Do',
    description: 'Manage tasks, projects, and quick notes.',
    icon: <ClipboardList className="h-6 w-6" />,
    enabled: false,
    cta: 'Get Things Done →',
  },
  {
    id: 'insights',
    title: 'Insights',
    description: 'Smart summaries that help you stay on track.',
    icon: <Lightbulb className="h-6 w-6" />,
    enabled: false,
    cta: 'Discover Insights →',
  },
];

export default function Orbit() {
  const { auth, signOut } = useAuth();
  const router = useRouter();
  const { state } = useFinance();
  const installPromptRef = useRef<Event & { prompt: () => Promise<void> } | null>(null);
  const [installVisible, setInstallVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e as Event & { prompt: () => Promise<void> };
      setInstallVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptRef.current) return;
    await installPromptRef.current.prompt();
    installPromptRef.current = null;
    setInstallVisible(false);
  };

  const handleSignOut = () => {
    signOut();
    router.push('/signin');
  };

  const userName = auth.status === 'authenticated' ? auth.user.name : '';

  // Track onboarding visibility — only evaluated once when data first loads.
  // Using a ref ensures adding accounts in the wizard doesn't retrigger the check
  // and accidentally dismiss the wizard mid-flow.
  const [showWizard, setShowWizard] = useState(false);
  const wizardInitRef = useRef(false);
  useEffect(() => {
    if (state.loadState === 'ready' && !wizardInitRef.current) {
      wizardInitRef.current = true;
      setShowWizard(state.accounts.length === 0 && state.assets.length === 0);
    }
  }, [state.loadState, state.accounts.length, state.assets.length]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {showWizard && <OnboardingWizard onDismiss={() => setShowWizard(false)} />}
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
          {installVisible && (
            <button type="button" onClick={handleInstall} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100">
              <Smartphone className="h-4 w-4" />
              Install App
            </button>
          )}
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

'use client';

import { Wallet, Target, HeartPulse, CheckCircle, ClipboardList, Lightbulb, LogOut, Settings, Tag } from 'lucide-react';
import Link from 'next/link';
import ModuleCard from '@/components/ModuleCard';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';

const MODULES = [
  {
    id: 'finance',
    title: 'Finance',
    description: 'Track accounts, expenses, investments and budgets.',
    icon: <Wallet className="h-6 w-6" />,
    href: '/orbit/finance',
    enabled: true,
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Set and track personal targets with progress tracking.',
    icon: <Target className="h-6 w-6" />,
    enabled: false,
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Track workouts, wellness, and daily habits.',
    icon: <HeartPulse className="h-6 w-6" />,
    enabled: false,
  },
  {
    id: 'habits',
    title: 'Habits',
    description: 'Build positive routines with streaks and reminders.',
    icon: <CheckCircle className="h-6 w-6" />,
    enabled: false,
  },
  {
    id: 'todo',
    title: 'To-Do',
    description: 'Manage tasks, projects, and quick notes.',
    icon: <ClipboardList className="h-6 w-6" />,
    enabled: false,
  },
  {
    id: 'insights',
    title: 'Insights',
    description: 'Smart summaries that help you stay on track.',
    icon: <Lightbulb className="h-6 w-6" />,
    enabled: false,
  },
];

export default function Orbit() {
  const { auth, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push('/signin');
  };

  const userName = auth.status === 'authenticated' ? auth.user.name : '';

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
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

        <div className="mt-12 flex items-center justify-center gap-3">
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

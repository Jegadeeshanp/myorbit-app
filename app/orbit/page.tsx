'use client';

import { Wallet, Target, HeartPulse, CheckCircle, ClipboardList, Lightbulb } from 'lucide-react';
import ModuleCard from '@/components/ModuleCard';

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
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700 shadow-sm">
            ⭑
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">MyOrbit</h1>
          <p className="mt-3 text-base text-gray-600">Choose what you want to manage today.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((module) => (
            <ModuleCard key={module.id} {...module} />
          ))}
        </div>
      </div>
    </main>
  );
}

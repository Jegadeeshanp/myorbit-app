'use client';

import {
  Wallet, Target, HeartPulse, CheckCircle, ClipboardList, Lightbulb,
  LogOut, Settings, Smartphone, X, Zap, Lock, MonitorSmartphone,
  ChevronRight, CheckCheck, Flame,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useFinance } from '@/lib/financeStore';
import OnboardingWizard from '@/components/OnboardingWizard';
import FirstRunSetup from '@/components/FirstRunSetup';
import OrbitIcon from '@/components/OrbitIcon';

// ── Types ──────────────────────────────────────────────────────────────────
type Task  = { id: string; title: string; priority: string; dueDate: string | null };
type Habit = { id: string; name: string; iconEmoji: string; color: string; daysOfWeek: string; logs: { logDate: string }[] };
type Goal  = { id: string; title: string; deadline: string | null; status: string };

const PRIORITY_COLOR: Record<string, string> = {
  high:   'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-blue-100 text-blue-700',
};

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
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white shadow-2xl overflow-hidden">
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 transition hover:bg-gray-200 dark:hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-5 space-y-3">
          {[
            { icon: MonitorSmartphone, text: 'Opens instantly — no browser, no tabs' },
            { icon: Zap,              text: 'Faster loads with offline caching'       },
            { icon: Lock,             text: 'Same app, same data — nothing changes'   },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-gray-600 dark:text-gray-200">{text}</p>
            </div>
          ))}
        </div>

        <div className="mx-6 border-t border-gray-200 dark:border-white/10" />

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">To install, use your browser menu:</p>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</span>
            <p className="text-sm text-gray-600 dark:text-gray-200 pt-0.5">
              Tap the <span className="font-semibold text-gray-900 dark:text-white">⋮ menu</span> in your browser
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</span>
            <p className="text-sm text-gray-600 dark:text-gray-200 pt-0.5">
              Tap <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:text-white">⊞ Install app</span> or <span className="font-semibold text-gray-900 dark:text-white">Add to Home Screen</span>
            </p>
          </div>
        </div>

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
            className="w-full rounded-2xl bg-gray-100 dark:bg-white/10 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-200 dark:hover:bg-white/15"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Greeting ───────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ── Small skeleton block ───────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className ?? ''}`} />;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Orbit() {
  const { auth, signOut } = useAuth();
  const router = useRouter();
  const { state } = useFinance();
  const installPromptRef = useRef<Event & { prompt: () => Promise<void> } | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  // First-run setup
  const [showFirstRun, setShowFirstRun] = useState(false);
  useEffect(() => {
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.preferences?.onboardingDone === false) setShowFirstRun(true);
    }).catch(() => {});
  }, []);

  // Dashboard data
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [habits,       setHabits]       = useState<Habit[]>([]);
  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [healthLogged, setHealthLogged] = useState<boolean | null>(null);
  const [dataLoading,  setDataLoading]  = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      fetch('/api/tasks?smartList=today').then(r => r.ok ? r.json() : []),
      fetch('/api/habits').then(r => r.ok ? r.json() : []),
      fetch('/api/goals').then(r => r.ok ? r.json() : []),
      fetch(`/api/health/entries?date=${today}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([t, h, g, health]) => {
      setTasks(Array.isArray(t) ? t.slice(0, 5) : []);
      setHabits(Array.isArray(h) ? h : []);
      setGoals(Array.isArray(g) ? (g as Goal[]).filter(gl => gl.status === 'active') : []);
      setHealthLogged(health && !health?.error ? true : false);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, []);

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

  const userName    = auth.status === 'authenticated' ? auth.user.name : '';
  const firstName   = userName.split(' ')[0] || 'there';

  const showWizardRef = useRef<boolean | null>(null);
  if (state.loadState === 'ready' && showWizardRef.current === null) {
    showWizardRef.current = state.accounts.length === 0 && state.assets.length === 0;
  }
  const showWizard = showWizardRef.current === true;

  // Finance totals from financeStore (already decrypted)
  const totalBalance = state.loadState === 'ready'
    ? state.accounts.reduce((s: number, a: any) => s + (a.balance ?? 0), 0)
    : null;

  // Habits: filter to those scheduled today
  const todayDow = new Date().getDay();
  const today    = new Date().toISOString().split('T')[0];
  const todayHabits = habits.filter(h => {
    try {
      const days: number[] = JSON.parse(h.daysOfWeek ?? '[0,1,2,3,4,5,6]');
      return days.includes(todayDow);
    } catch { return true; }
  });
  const doneCount = todayHabits.filter(h => h.logs.some(l => l.logDate === today)).length;

  // Nearest goal deadline
  const nearestGoal = goals
    .filter(g => g.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0];

  const daysUntil = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  };

  const fmtBalance = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const MODULES = [
    { id: 'finance', label: 'Finance',  icon: <Wallet   className="h-5 w-5" />, href: '/orbit/finance',  color: 'text-emerald-700 bg-emerald-50' },
    { id: 'goals',   label: 'Goals',    icon: <Target   className="h-5 w-5" />, href: '/orbit/goals',    color: 'text-violet-700  bg-violet-50'  },
    { id: 'health',  label: 'Health',   icon: <HeartPulse className="h-5 w-5" />, href: '/orbit/health', color: 'text-rose-700   bg-rose-50'    },
    { id: 'habits',  label: 'Habits',   icon: <CheckCircle className="h-5 w-5" />, href: '/orbit/habits', color: 'text-teal-700  bg-teal-50'    },
    { id: 'tasks',   label: 'Tasks',    icon: <ClipboardList className="h-5 w-5" />, href: '/orbit/tasks', color: 'text-blue-700  bg-blue-50'    },
    { id: 'insights',label: 'Insights', icon: <Lightbulb className="h-5 w-5" />, href: '/orbit/insights', color: 'text-amber-700 bg-amber-50'   },
  ];

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-gray-900">
      {showFirstRun && <FirstRunSetup onComplete={() => setShowFirstRun(false)} />}
      {!showFirstRun && showWizard && <OnboardingWizard onDismiss={() => { showWizardRef.current = false; }} />}

      {installOpen && (
        <InstallModal
          onClose={() => setInstallOpen(false)}
          onInstall={handleInstall}
          canInstall={canInstall}
        />
      )}

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <OrbitIcon
                src="/icons/app-logo.svg"
                className="h-9 w-9 rounded-xl object-cover shadow-sm"
                fallbackClassName="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-sm"
              />
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {greeting()}{firstName ? `, ${firstName}` : ''}!
                </p>
                <p className="text-xs text-gray-500">{formatDate()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/orbit/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50">
              <Settings className="h-4 w-4" />
            </Link>
            <button type="button" onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Weekly review banner (Mondays only) ── */}
        {new Date().getDay() === 1 && (
          <Link
            href="/orbit/insights/weekly"
            className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm transition hover:bg-violet-100 hover:shadow-md group"
          >
            <span className="text-xl">📊</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-violet-900">Your week in review is ready</p>
              <p className="text-xs text-violet-600">See last week's Life Score, wins, and focus areas</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-none text-violet-400 transition group-hover:text-violet-600" />
          </Link>
        )}

        {/* ── Money + Goals row ── */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {/* Money */}
          <Link href="/orbit/finance"
            className="group flex flex-col justify-between rounded-2xl border border-white/60 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-gray-400" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">Total balance</p>
              {totalBalance !== null ? (
                <p className="mt-0.5 text-xl font-semibold text-gray-900">{fmtBalance(totalBalance)}</p>
              ) : (
                <Skeleton className="mt-1 h-7 w-24" />
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {state.loadState === 'ready' ? `${state.accounts.length} account${state.accounts.length !== 1 ? 's' : ''}` : '…'}
              </p>
            </div>
          </Link>

          {/* Goals */}
          <Link href="/orbit/goals"
            className="group flex flex-col justify-between rounded-2xl border border-white/60 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Target className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:text-gray-400" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">Active goals</p>
              {dataLoading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="mt-0.5 text-xl font-semibold text-gray-900">{goals.length}</p>
              )}
              {nearestGoal && !dataLoading && (
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {nearestGoal.title} · {daysUntil(nearestGoal.deadline!)}d
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* ── Today's Tasks ── */}
        <div className="mt-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Today&apos;s Tasks</h2>
            </div>
            <Link href="/orbit/tasks" className="flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-800">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {dataLoading ? (
              <>
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-4/5" />
                <Skeleton className="h-9 w-3/5" />
              </>
            ) : tasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No tasks due today.{' '}
                <Link href="/orbit/tasks" className="text-emerald-600 hover:underline">Add one →</Link>
              </p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                  <span className="h-4 w-4 flex-none rounded-full border-2 border-gray-300" />
                  <span className="flex-1 truncate text-sm text-gray-800">{task.title}</span>
                  {task.priority !== 'none' && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[task.priority] ?? ''}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Habits ── */}
        <div className="mt-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-teal-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Today&apos;s Habits
                {!dataLoading && todayHabits.length > 0 && (
                  <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    {doneCount}/{todayHabits.length}
                  </span>
                )}
              </h2>
            </div>
            <Link href="/orbit/habits" className="flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-800">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {dataLoading ? (
              <>
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-4/5" />
                <Skeleton className="h-9 w-3/5" />
              </>
            ) : todayHabits.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No habits scheduled today.{' '}
                <Link href="/orbit/habits" className="text-emerald-600 hover:underline">Add one →</Link>
              </p>
            ) : (
              todayHabits.slice(0, 5).map(habit => {
                const done = habit.logs.some(l => l.logDate === today);
                return (
                  <div key={habit.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${done ? 'border-teal-100 bg-teal-50/60' : 'border-gray-100'}`}>
                    <span className="text-base">{habit.iconEmoji}</span>
                    <span className={`flex-1 truncate text-sm ${done ? 'text-teal-700' : 'text-gray-800'}`}>{habit.name}</span>
                    {done && <CheckCheck className="h-4 w-4 flex-none text-teal-500" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Health check-in ── */}
        <div className="mt-4">
          {healthLogged === true ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-5 py-4 shadow-sm">
              <HeartPulse className="h-5 w-5 flex-none text-rose-500" />
              <p className="flex-1 text-sm text-rose-700">Health logged today</p>
              <Link href="/orbit/health" className="flex items-center gap-0.5 text-xs text-rose-600 hover:text-rose-800">
                View <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : healthLogged === false ? (
            <Link href="/orbit/health"
              className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
              <HeartPulse className="h-5 w-5 flex-none text-rose-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">No health entry today</p>
                <p className="text-xs text-gray-400">How are you feeling? Log steps, mood & more →</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-none text-gray-300" />
            </Link>
          ) : (
            <Skeleton className="h-16 w-full rounded-2xl" />
          )}
        </div>

        {/* ── Module quick-links ── */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">All modules</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {MODULES.map(m => (
              <Link
                key={m.id}
                href={m.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white px-3 py-4 shadow-sm transition hover:shadow-md"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.color}`}>
                  {m.icon}
                </span>
                <span className="text-xs font-medium text-gray-700">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Bottom actions ── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setInstallOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          >
            <Smartphone className="h-4 w-4" />
            Install App
          </button>
        </div>
      </div>
    </main>
  );
}

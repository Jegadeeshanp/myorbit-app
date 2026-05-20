'use client';

import {
  Wallet, Target, HeartPulse, CheckCircle, ClipboardList, Lightbulb,
  LogOut, Settings, ChevronRight, CheckCheck, Flame, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFinance } from '@/lib/financeStore';
import OnboardingWizard from '@/components/OnboardingWizard';
import FirstRunSetup from '@/components/FirstRunSetup';
import OrbitIcon from '@/components/OrbitIcon';
import { toast } from '@/components/Toast';

// ── Types ──────────────────────────────────────────────────────────────────
type Task  = { id: string; title: string; priority: string; dueDate: string | null; status: string };
type Habit = { id: string; name: string; iconEmoji: string; color: string; daysOfWeek: string; logs: { logDate: string }[] };
type Goal  = { id: string; title: string; deadline: string | null; status: string };

// ── Helpers ────────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildSmartSummary(
  firstName: string,
  doneCount: number,
  habitTotal: number,
  overdueCount: number,
  totalTasks: number,
): string {
  const parts: string[] = [];

  if (habitTotal > 0) {
    const pct = Math.round((doneCount / habitTotal) * 100);
    if (pct >= 80)        parts.push(`You're on fire — ${doneCount}/${habitTotal} habits done today.`);
    else if (pct >= 50)   parts.push(`Halfway through your habits — ${doneCount}/${habitTotal} done.`);
    else if (doneCount === 0) parts.push(`${habitTotal} habit${habitTotal > 1 ? 's' : ''} waiting for you today.`);
    else                  parts.push(`${doneCount} of ${habitTotal} habits done so far.`);
  }

  if (overdueCount > 3)        parts.push(`${overdueCount} overdue tasks need attention — start with the top priority.`);
  else if (overdueCount > 0)   parts.push(`${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue — a good time to clear the deck.`);
  else if (totalTasks > 0 && parts.length < 2) parts.push(`${totalTasks} task${totalTasks > 1 ? 's' : ''} on your list, all on schedule.`);

  return parts.slice(0, 2).join(' ') || `Let's make today count, ${firstName}.`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-white/5 ${className ?? ''}`} />;
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Orbit() {
  const { auth, signOut } = useAuth();
  const router = useRouter();
  const { state } = useFinance();

  const [showFirstRun, setShowFirstRun] = useState(false);
  useEffect(() => {
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.preferences?.onboardingDone === false) setShowFirstRun(true);
    }).catch(() => {});
  }, []);

  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [habits,       setHabits]       = useState<Habit[]>([]);
  const [goals,        setGoals]        = useState<Goal[]>([]);
  const [healthLogged, setHealthLogged] = useState<boolean | null>(null);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?smartList=all').then(r => r.ok ? r.json() : []),
      fetch('/api/habits').then(r => r.ok ? r.json() : []),
      fetch('/api/goals').then(r => r.ok ? r.json() : []),
      fetch(`/api/health/entries?date=${today}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([t, h, g, health]) => {
      setTasks(Array.isArray(t) ? t : []);
      setHabits(Array.isArray(h) ? h : []);
      setGoals(Array.isArray(g) ? (g as Goal[]).filter(gl => gl.status === 'active') : []);
      setHealthLogged(health && !health?.error ? true : false);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, [today]);

  const handleSignOut = () => { signOut(); router.push('/signin'); };

  const userName  = auth.status === 'authenticated' ? auth.user.name : '';
  const firstName = userName.split(' ')[0] || 'there';

  const showWizardRef = useRef<boolean | null>(null);
  if (state.loadState === 'ready' && showWizardRef.current === null) {
    showWizardRef.current = state.accounts.length === 0 && state.assets.length === 0;
  }

  const totalBalance = state.loadState === 'ready'
    ? state.accounts.reduce((s: number, a: any) => s + (a.balance ?? 0), 0)
    : null;

  const todayDow    = new Date().getDay();
  const todayHabits = habits.filter(h => {
    try { const days: number[] = JSON.parse(h.daysOfWeek ?? '[0,1,2,3,4,5,6]'); return days.includes(todayDow); }
    catch { return true; }
  });

  const [doneHabitIds, setDoneHabitIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    setDoneHabitIds(new Set(habits.filter(h => h.logs.some(l => l.logDate === today)).map(h => h.id)));
  }, [habits, today]);

  const doneCount = todayHabits.filter(h => doneHabitIds.has(h.id)).length;

  const toggleHabit = useCallback(async (habitId: string) => {
    const wasDone = doneHabitIds.has(habitId);
    setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.delete(habitId) : n.add(habitId); return n; });
    try {
      const res  = await fetch(`/api/habits/${habitId}/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logDate: today }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast(data.removed ? 'Habit unmarked' : 'Habit done! 🎉', 'success');
    } catch {
      setDoneHabitIds(prev => { const n = new Set(prev); wasDone ? n.add(habitId) : n.delete(habitId); return n; });
      toast('Could not update habit', 'error');
    }
  }, [doneHabitIds, today]);

  const nearestGoal = goals.filter(g => g.deadline).sort((a, b) => a.deadline! < b.deadline! ? -1 : 1)[0];
  const daysUntil   = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  const fmtBalance  = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(n));

  const sortedTasks = [...tasks].sort((a, b) => {
    const ao = a.dueDate && a.dueDate < today, bo = b.dueDate && b.dueDate < today;
    const at = a.dueDate === today,            bt = b.dueDate === today;
    if (ao && !bo) return -1; if (!ao && bo) return 1;
    if (at && !bt) return -1; if (!at && bt) return 1;
    if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return a.dueDate ? -1 : b.dueDate ? 1 : 0;
  });

  const overdueTasks   = sortedTasks.filter(t => t.dueDate && t.dueDate < today);
  const FOCUS_LIMIT    = 3;
  const focusTasks     = sortedTasks.slice(0, FOCUS_LIMIT);
  const remainingCount = Math.max(0, sortedTasks.length - FOCUS_LIMIT);
  const habitProgress  = todayHabits.length > 0 ? Math.round((doneCount / todayHabits.length) * 100) : 0;
  const smartSummary   = buildSmartSummary(firstName, doneCount, todayHabits.length, overdueTasks.length, sortedTasks.length);

  const MODULES = [
    { id: 'finance',  label: 'Finance',  icon: Wallet,       href: '/orbit/finance',  color: '#059669' },
    { id: 'goals',    label: 'Goals',    icon: Target,       href: '/orbit/goals',    color: '#7C3AED' },
    { id: 'health',   label: 'Health',   icon: HeartPulse,   href: '/orbit/health',   color: '#E11D48' },
    { id: 'habits',   label: 'Habits',   icon: CheckCircle,  href: '/orbit/habits',   color: '#D97706' },
    { id: 'tasks',    label: 'Tasks',    icon: ClipboardList,href: '/orbit/tasks',    color: '#2563EB' },
    { id: 'insights', label: 'Insights', icon: Lightbulb,    href: '/orbit/insights', color: '#CA8A04' },
  ];

  return (
    <main className="min-h-screen bg-[#F4F4F2] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100">
      {showFirstRun && <FirstRunSetup onComplete={() => setShowFirstRun(false)} />}
      {!showFirstRun && showWizardRef.current === true && (
        <OnboardingWizard onDismiss={() => { showWizardRef.current = false; }} />
      )}

      <div className="mx-auto w-full max-w-screen-2xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 xl:px-14">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <OrbitIcon
              src="/icons/app-logo.svg"
              className="h-8 w-8 rounded-xl object-cover"
              fallbackClassName="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white"
            />
            <div>
              <p className="text-[15px] font-semibold leading-tight text-gray-900 dark:text-gray-50">
                {greeting()}, {firstName}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{formatDate()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/orbit/settings"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-white/5 text-gray-400 shadow-sm transition hover:text-gray-600 dark:hover:text-gray-300">
              <Settings className="h-3.5 w-3.5" />
            </Link>
            <button onClick={handleSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-white/5 text-gray-400 shadow-sm transition hover:text-gray-600 dark:hover:text-gray-300">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Hero AI Summary Card ── */}
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#071a10] via-[#0d2318] to-[#0a1628] p-6 shadow-[0_8px_48px_rgba(0,0,0,0.22)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/6 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-64 rounded-full bg-blue-500/4 blur-3xl" />

          <div className="relative">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20">
                <Sparkles className="h-3 w-3 text-emerald-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">Daily Orbit</span>
            </div>

            <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-gray-200/85">
              {dataLoading
                ? <span className="inline-block h-5 w-72 animate-pulse rounded bg-white/8" />
                : smartSummary}
            </p>

            <div className="flex flex-wrap gap-2">
              {!dataLoading && todayHabits.length > 0 && (
                <Link href="/orbit/habits"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                  <Flame className="h-3 w-3" />
                  {doneCount}/{todayHabits.length} habits
                </Link>
              )}
              {!dataLoading && overdueTasks.length > 0 && (
                <Link href="/orbit/tasks"
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/12 px-3 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20">
                  ⚠ {overdueTasks.length} overdue
                </Link>
              )}
              {!dataLoading && nearestGoal && (
                <Link href="/orbit/goals"
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/12 px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20">
                  <Target className="h-3 w-3" />
                  {nearestGoal.title.length > 22 ? nearestGoal.title.slice(0, 22) + '…' : nearestGoal.title} · {daysUntil(nearestGoal.deadline!)}d
                </Link>
              )}
              {!dataLoading && totalBalance !== null && (
                <Link href="/orbit/finance"
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/12 px-3 py-1.5 text-[11px] font-semibold text-blue-300 transition hover:bg-blue-500/20">
                  <Wallet className="h-3 w-3" />
                  ₹{fmtBalance(totalBalance)} net
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Module shortcuts ── */}
        <div className="mb-6 grid grid-cols-6 gap-2">
          {MODULES.map(m => {
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                href={m.href}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-[#111827] px-2 py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.22)] transition hover:scale-[1.04] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: m.color + '18', color: m.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{m.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ── Monday review banner ── */}
        {new Date().getDay() === 1 && (
          <Link href="/orbit/insights/weekly"
            className="mb-6 flex items-center gap-3 rounded-2xl bg-violet-50 dark:bg-violet-950/25 px-4 py-3 transition hover:bg-violet-100 dark:hover:bg-violet-950/40 group">
            <span className="text-lg">📊</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">Your week in review is ready</p>
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">Life Score, wins, and focus areas from last week</p>
            </div>
            <ChevronRight className="h-4 w-4 text-violet-300 transition group-hover:text-violet-500" />
          </Link>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left / Focus column ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Today's Focus */}
            <div className="rounded-3xl bg-white dark:bg-[#111827] p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_32px_rgba(0,0,0,0.28)]">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-50">Today&apos;s Focus</h2>
                  {!dataLoading && sortedTasks.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                      {overdueTasks.length > 0 ? `${overdueTasks.length} overdue · ` : ''}{sortedTasks.length} total
                    </p>
                  )}
                </div>
                <Link href="/orbit/tasks" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition">
                  All tasks →
                </Link>
              </div>

              {dataLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : sortedTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-2 text-2xl">✅</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    All clear.{' '}
                    <Link href="/orbit/tasks" className="text-emerald-600 dark:text-emerald-400 hover:underline">Add a task →</Link>
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                    {(showAllTasks ? sortedTasks : focusTasks).map((task, i) => {
                      const isOverdue  = task.dueDate && task.dueDate < today;
                      const isDueToday = task.dueDate === today;
                      return (
                        <div key={task.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                          <span className={`w-4 flex-none text-center text-[11px] font-bold tabular-nums ${isOverdue ? 'text-rose-400' : isDueToday ? 'text-blue-400' : 'text-gray-200 dark:text-gray-700'}`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{task.title}</p>
                            {(isOverdue || isDueToday) && (
                              <p className={`mt-0.5 text-[10px] ${isOverdue ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
                                {isOverdue ? 'Overdue' : 'Due today'}
                              </p>
                            )}
                          </div>
                          {task.priority && task.priority !== 'none' && (
                            <span className={`flex-none text-[10px] font-semibold uppercase tracking-wide ${
                              task.priority === 'urgent' || task.priority === 'high' ? 'text-rose-400' :
                              task.priority === 'medium' ? 'text-amber-500 dark:text-amber-400' :
                              'text-gray-300 dark:text-gray-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {remainingCount > 0 && (
                    <button
                      onClick={() => setShowAllTasks(v => !v)}
                      className="mt-4 w-full rounded-xl bg-gray-50 dark:bg-white/4 py-2 text-[12px] font-medium text-gray-400 dark:text-gray-500 transition hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showAllTasks ? '↑ Show less' : `+${remainingCount} more task${remainingCount > 1 ? 's' : ''}`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Today's Habits */}
            <div className="rounded-3xl bg-white dark:bg-[#111827] p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_32px_rgba(0,0,0,0.28)]">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-50">Today&apos;s Habits</h2>
                  {!dataLoading && todayHabits.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{doneCount} of {todayHabits.length} complete</p>
                  )}
                </div>
                <Link href="/orbit/habits" className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition">
                  All habits →
                </Link>
              </div>

              {!dataLoading && todayHabits.length > 0 && (
                <div className="mb-5 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${habitProgress}%` }} />
                </div>
              )}

              {dataLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              ) : todayHabits.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No habits scheduled today.{' '}
                    <Link href="/orbit/habits" className="text-emerald-600 dark:text-emerald-400 hover:underline">Add one →</Link>
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {todayHabits.map(habit => {
                    const done = doneHabitIds.has(habit.id);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className="group flex w-full items-center gap-4 py-3 text-left transition first:pt-0 last:pb-0"
                      >
                        <span className="flex-none text-[17px] leading-none">{habit.iconEmoji}</span>
                        <span className={`flex-1 text-sm font-medium transition-colors ${done ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                          {habit.name}
                        </span>
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full transition-all ${
                          done
                            ? 'bg-emerald-500 text-white'
                            : 'border border-gray-200 dark:border-gray-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-600'
                        }`}>
                          {done && <CheckCheck className="h-2.5 w-2.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Health check-in row */}
            {healthLogged !== null && (
              <Link
                href="/orbit/health"
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 transition ${
                  healthLogged
                    ? 'bg-rose-50 dark:bg-rose-950/15'
                    : 'bg-white dark:bg-[#111827] shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)]'
                }`}
              >
                <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${healthLogged ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-rose-50 dark:bg-rose-950/30'}`}>
                  <HeartPulse className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {healthLogged ? 'Health logged today ✓' : 'Log your health'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {healthLogged ? 'Tap to view your metrics' : 'Steps, sleep, mood & more →'}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-none text-gray-300 dark:text-gray-600 transition group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {/* ── Right / Insights column ── */}
          <div className="space-y-5">

            {/* Orbit Insights */}
            <div className="rounded-3xl bg-white dark:bg-[#111827] p-6 shadow-[0_2px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_32px_rgba(0,0,0,0.28)]">
              <h2 className="mb-5 text-[15px] font-semibold text-gray-900 dark:text-gray-50">Orbit Insights</h2>

              <div className="space-y-5">
                {/* Finance */}
                <Link href="/orbit/finance" className="group flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                    <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Finance</p>
                    {totalBalance !== null ? (
                      <>
                        <p className={`mt-0.5 text-[22px] font-bold leading-tight tracking-tight ${totalBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-gray-50'}`}>
                          {totalBalance < 0 ? '–' : ''}₹{fmtBalance(totalBalance)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          Net position · {state.loadState === 'ready' ? state.accounts.length : '—'} accounts
                        </p>
                      </>
                    ) : <Skeleton className="mt-1 h-7 w-24" />}
                  </div>
                </Link>

                <div className="h-px bg-gray-50 dark:bg-gray-800" />

                {/* Goals */}
                <Link href="/orbit/goals" className="group flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                    <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Goals</p>
                    {dataLoading ? <Skeleton className="mt-1 h-7 w-16" /> : (
                      <>
                        <p className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-50">{goals.length}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {nearestGoal
                            ? `${nearestGoal.title.length > 24 ? nearestGoal.title.slice(0, 24) + '…' : nearestGoal.title} · ${daysUntil(nearestGoal.deadline!)}d`
                            : 'Active goals in progress'}
                        </p>
                      </>
                    )}
                  </div>
                </Link>

                <div className="h-px bg-gray-50 dark:bg-gray-800" />

                {/* Health */}
                <Link href="/orbit/health" className="group flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30">
                    <HeartPulse className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Health</p>
                    {healthLogged === null ? <Skeleton className="mt-1 h-5 w-32" /> : (
                      <>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {healthLogged ? 'Logged today ✓' : 'Not logged yet'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                          {healthLogged ? 'View your metrics →' : 'Track steps, sleep & mood'}
                        </p>
                      </>
                    )}
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

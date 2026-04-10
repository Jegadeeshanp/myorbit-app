'use client';

import { TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { DashboardData } from '@/lib/healthStore';

type Insight = {
  type: 'warning' | 'success' | 'info';
  message: string;
};

function buildInsights(dashboard: DashboardData, recentEntries: { sleepHours?: number | null; date: string }[]): Insight[] {
  const insights: Insight[] = [];
  const { todayEntry, healthHabits, weeklyStats, healthGoals, todayWorkouts } = dashboard;

  // 1. Low steps
  if (!todayEntry?.steps || todayEntry.steps < 5000) {
    insights.push({ type: 'info', message: "You're below 5,000 steps today — a short walk can help." });
  }

  // 2. Poor sleep pattern (< 6 hrs for 3+ of last 7 entries)
  const shortSleepDays = recentEntries.filter(e => e.sleepHours != null && e.sleepHours < 6).length;
  if (shortSleepDays >= 3) {
    insights.push({ type: 'warning', message: `Sleep under 6 hours on ${shortSleepDays} of the last 7 nights — consider an earlier bedtime.` });
  }

  // 3. Health habit consistency
  const missedHabits = healthHabits.filter(h => {
    const days = JSON.parse(h.daysOfWeek || '[1,2,3,4,5,6,7]') as number[];
    const today = new Date().getDay() || 7; // 1=Mon..7=Sun
    return days.includes(today) && !h.completedToday;
  });
  if (missedHabits.length > 0) {
    insights.push({
      type: 'warning',
      message: `${missedHabits.length} health habit${missedHabits.length > 1 ? 's' : ''} not yet done today: ${missedHabits.slice(0, 2).map(h => h.name).join(', ')}.`,
    });
  }

  // 4. Completed workouts this week
  if (weeklyStats.workoutsThisWeek >= 3) {
    insights.push({ type: 'success', message: `Great job — ${weeklyStats.workoutsThisWeek} workouts logged this week!` });
  } else if (weeklyStats.workoutsThisWeek === 0) {
    insights.push({ type: 'info', message: 'No workouts logged this week. Even a 20-minute session makes a difference.' });
  }

  // 5. Active health goals with no recent activity
  const activeGoals = healthGoals.filter(g => g.status === 'active');
  if (activeGoals.length > 0 && weeklyStats.habitsCompletedThisWeek === 0 && weeklyStats.workoutsThisWeek === 0) {
    insights.push({
      type: 'warning',
      message: `No activity logged toward your "${activeGoals[0].title}" goal this week.`,
    });
  }

  return insights.slice(0, 4);
}

type Props = {
  dashboard: DashboardData;
  recentEntries: { sleepHours?: number | null; date: string }[];
};

const ICONS = {
  warning: <AlertCircle className="h-4 w-4 text-amber-500 flex-none mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-400 flex-none mt-0.5" />,
};

const BORDERS = {
  warning: 'border-amber-100 bg-amber-50',
  success: 'border-emerald-100 bg-emerald-50',
  info: 'border-blue-100 bg-blue-50',
};

export default function HealthInsights({ dashboard, recentEntries }: Props) {
  const insights = buildInsights(dashboard, recentEntries);

  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 shadow-sm text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">All good — keep it up!</p>
        <p className="text-xs text-gray-400 mt-1">Log more data to surface personalized insights.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-gray-900">Health Insights</p>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${BORDERS[ins.type]}`}>
            {ICONS[ins.type]}
            <p className="text-xs text-gray-700 leading-relaxed">{ins.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
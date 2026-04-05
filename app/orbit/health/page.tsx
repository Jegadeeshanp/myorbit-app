'use client';

import { useState } from 'react';
import {
  Plus, Dumbbell, Target, CheckCircle2, Circle,
  Flame, Clock, ChevronRight, Pencil, Trash2, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useHealth } from '@/lib/healthStore';
import HealthRings from '@/components/health/HealthRings';
import HealthInsights from '@/components/health/HealthInsights';
import LogHealthModal from '@/components/health/LogHealthModal';
import AddWorkoutModal from '@/components/health/AddWorkoutModal';
import { toast } from '@/components/Toast';

const WORKOUT_EMOJI: Record<string, string> = {
  running: '🏃', cycling: '🚴', strength: '💪', yoga: '🧘', sports: '⚽', other: '🏋️',
};

const MOOD_LABELS = ['', '😞', '😕', '😐', '😊', '😄'];

export default function HealthPage() {
  const { loadState, entries, dashboard, addHealthEntry, addWorkout, deleteWorkout, completeHealthTask } = useHealth();

  const [logOpen, setLogOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-gray-400">Failed to load health data. Please refresh.</p>
      </div>
    );
  }

  const d = dashboard;
  const todayEntry = d?.todayEntry;
  const todayWorkoutMins = (d?.todayWorkouts ?? []).reduce((s, w) => s + w.durationMins, 0);
  const totalCalories = (d?.todayWorkouts ?? []).reduce((s, w) => s + (w.caloriesBurned ?? 0), 0);

  async function handleCompleteTask(taskId: string) {
    setCompletingTask(taskId);
    try {
      await completeHealthTask(taskId);
      toast('Task completed & workout logged!');
    } catch {
      toast('Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  }

  async function handleToggleHabit(habitId: string, completed: boolean) {
    if (completed) return; // already done
    setTogglingHabit(habitId);
    try {
      await fetch(`/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logDate: today, value: 1 }),
      });
      toast('Habit marked done!');
      // Reload dashboard via reload
      window.location.reload();
    } catch {
      toast('Failed to log habit');
    } finally {
      setTogglingHabit(null);
    }
  }

  async function handleDeleteWorkout(id: string) {
    try {
      await deleteWorkout(id);
      toast('Workout deleted');
    } catch {
      toast('Failed to delete workout');
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <button onClick={() => setWorkoutOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Dumbbell className="h-4 w-4 text-gray-400" />
            Add Workout
          </button>
          <button onClick={() => setLogOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm transition">
            <Plus className="h-4 w-4" />
            Log Today
          </button>
        </div>
      </div>

      {/* Rings */}
      <HealthRings
        steps={todayEntry?.steps}
        sleepHours={todayEntry?.sleepHours}
        waterMl={todayEntry?.waterMl}
        caloriesBurned={totalCalories || undefined}
        workoutMins={todayWorkoutMins || undefined}
      />

      {/* Metric cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Mood', value: todayEntry?.mood ? MOOD_LABELS[todayEntry.mood] : '—', sub: todayEntry?.mood ? ['Bad','Poor','Okay','Good','Great'][todayEntry.mood-1] : 'Not logged', color: 'rose' },
          { label: 'Energy', value: todayEntry?.energyLevel ? `${todayEntry.energyLevel}/10` : '—', sub: 'Energy level', color: 'amber' },
          { label: 'Weight', value: todayEntry?.weightKg ? `${todayEntry.weightKg} kg` : '—', sub: 'Body weight', color: 'blue' },
          { label: 'Heart Rate', value: todayEntry?.heartRate ? `${todayEntry.heartRate} bpm` : '—', sub: 'Resting HR', color: 'rose' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-400">{card.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{card.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Today's Health Tasks */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-gray-900">Today's Health Tasks</p>
          {(d?.healthTasks ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No health tasks scheduled today.</p>
              <p className="text-xs text-gray-300 mt-0.5">Link tasks to health habits to see them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(d?.healthTasks ?? []).map(task => (
                <div key={task.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${task.status === 'completed' ? 'bg-emerald-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <button
                    onClick={() => task.status !== 'completed' && handleCompleteTask(task.id)}
                    disabled={completingTask === task.id || task.status === 'completed'}
                    className="flex-none"
                  >
                    {task.status === 'completed'
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : completingTask === task.id
                        ? <div className="h-5 w-5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                        : <Circle className="h-5 w-5 text-gray-300 hover:text-rose-400 transition" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    {task.dueTime && (
                      <p className="text-[11px] text-gray-400">{task.dueTime}</p>
                    )}
                  </div>
                  {task.habit && (
                    <span className="text-sm flex-none">{task.habit.iconEmoji ?? '🏃'}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Habits */}
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Health Habits</p>
            <Link href="/orbit/habits" className="text-xs text-rose-500 hover:text-rose-600 transition">
              Manage →
            </Link>
          </div>
          {(d?.healthHabits ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Activity className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No health habits set up.</p>
              <Link href="/orbit/habits" className="text-xs text-rose-500 mt-1 hover:underline">
                Add habits with the "health" category →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(d?.healthHabits ?? []).map(habit => (
                <div key={habit.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${habit.completedToday ? 'bg-emerald-50' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'}`}
                  onClick={() => !habit.completedToday && handleToggleHabit(habit.id, habit.completedToday)}
                >
                  <div className="flex-none">
                    {habit.completedToday
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : togglingHabit === habit.id
                        ? <div className="h-5 w-5 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                        : <Circle className="h-5 w-5 text-gray-300" />
                    }
                  </div>
                  <span className="text-base flex-none">{habit.iconEmoji ?? '✅'}</span>
                  <p className={`flex-1 text-sm font-medium truncate ${habit.completedToday ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {habit.name}
                  </p>
                  {habit.completedToday && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-medium flex-none">Done</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workouts today */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Today's Workouts</p>
          <div className="flex items-center gap-3">
            {(d?.todayWorkouts ?? []).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {todayWorkoutMins}m
                {totalCalories > 0 && (
                  <>
                    <Flame className="h-3.5 w-3.5 ml-1" />
                    {totalCalories} kcal
                  </>
                )}
              </div>
            )}
            <button onClick={() => setWorkoutOpen(true)}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 transition">
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
        {(d?.todayWorkouts ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Dumbbell className="h-8 w-8 text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">No workouts logged today.</p>
            <button onClick={() => setWorkoutOpen(true)}
              className="mt-2 text-xs text-rose-500 hover:underline">Log a workout →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {(d?.todayWorkouts ?? []).map(w => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 group">
                <span className="text-xl flex-none">{WORKOUT_EMOJI[w.type] ?? '🏋️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                  <p className="text-xs text-gray-400">
                    {w.durationMins} min
                    {w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ''}
                    {w.distanceKm ? ` · ${w.distanceKm} km` : ''}
                  </p>
                </div>
                <button onClick={() => handleDeleteWorkout(w.id)}
                  className="hidden group-hover:flex items-center justify-center h-7 w-7 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition flex-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Goals */}
      {(d?.healthGoals ?? []).length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Health Goals</p>
            <Link href="/orbit/goals" className="text-xs text-rose-500 hover:text-rose-600 transition">
              All goals →
            </Link>
          </div>
          <div className="space-y-2">
            {(d?.healthGoals ?? []).map(goal => {
              const done = goal.milestones.filter(m => m.isCompleted).length;
              const total = goal.milestones.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={goal.id} href={`/orbit/goals/${goal.id}`}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 hover:bg-gray-100 transition group">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-rose-50">
                    <Target className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                    {total > 0 ? (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                          <div className="h-1.5 rounded-full bg-rose-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 flex-none">{done}/{total}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">{goal.metric ?? 'No milestones yet'}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 flex-none" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly summary */}
      {d && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Habits this week', value: d.weeklyStats.habitsCompletedThisWeek, color: 'emerald' },
            { label: 'Workouts this week', value: d.weeklyStats.workoutsThisWeek, color: 'blue' },
            { label: 'Avg sleep', value: d.weeklyStats.avgSleep ? `${d.weeklyStats.avgSleep}h` : '—', color: 'purple' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {d && (
        <HealthInsights dashboard={d} recentEntries={entries} />
      )}

      {/* Modals */}
      <LogHealthModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        initial={dashboard?.todayEntry}
        onSave={addHealthEntry}
      />
      <AddWorkoutModal
        open={workoutOpen}
        onClose={() => setWorkoutOpen(false)}
        onSave={addWorkout}
      />
    </div>
  );
}

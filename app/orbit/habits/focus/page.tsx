'use client';

import PomodoroTimer from '@/components/tasks/PomodoroTimer';

export default function HabitsFocusPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Focus Timer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Deep work engine — Pomodoro & stopwatch modes</p>
      </div>
      <PomodoroTimer />
    </div>
  );
}

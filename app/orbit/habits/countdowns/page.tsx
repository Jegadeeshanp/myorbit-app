'use client';

import CountdownCards from '@/components/tasks/CountdownCard';

export default function HabitsCountdownsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Countdowns</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track important dates and milestones</p>
      </div>
      <CountdownCards />
    </div>
  );
}

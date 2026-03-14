'use client';

import { insights as insightsData, Insight } from '@/lib/financeData';
import { useState } from 'react';

export default function InsightsPage() {
  const [insights] = useState<Insight[]>(insightsData);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>
          <p className="mt-1 text-sm text-gray-600">
            Financial insights based on your activity and trends.
          </p>
        </div>

        <button className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
          Refresh insights
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900">{insight.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

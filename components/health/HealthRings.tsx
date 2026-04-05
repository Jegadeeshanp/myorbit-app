'use client';

import { Footprints, Moon, Droplets, Flame, Timer } from 'lucide-react';

type RingProps = {
  label: string;
  value: number;
  max: number;
  color: string;
  trackColor: string;
  icon: React.ReactNode;
  unit: string;
  displayValue: string;
};

function Ring({ label, value, max, color, trackColor, icon, unit, displayValue }: RingProps) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="80" height="80">
          <circle cx="40" cy="40" r={r} fill="none" stroke={trackColor} strokeWidth="8" />
          <circle
            cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          />
        </svg>
        <div className="z-10 text-gray-500">{icon}</div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-900">{displayValue}</p>
        <p className="text-[11px] text-gray-400">{label}</p>
      </div>
    </div>
  );
}

type HealthRingsProps = {
  steps?: number | null;
  sleepHours?: number | null;
  waterMl?: number | null;
  caloriesBurned?: number | null;
  workoutMins?: number | null;
};

export default function HealthRings({ steps, sleepHours, waterMl, caloriesBurned, workoutMins }: HealthRingsProps) {
  const rings: RingProps[] = [
    {
      label: 'Steps',
      value: steps ?? 0,
      max: 10000,
      color: '#3b82f6',
      trackColor: '#dbeafe',
      icon: <Footprints className="h-5 w-5" />,
      unit: 'steps',
      displayValue: steps ? steps.toLocaleString() : '—',
    },
    {
      label: 'Exercise',
      value: workoutMins ?? 0,
      max: 60,
      color: '#f43f5e',
      trackColor: '#ffe4e6',
      icon: <Timer className="h-5 w-5" />,
      unit: 'min',
      displayValue: workoutMins ? `${workoutMins}m` : '—',
    },
    {
      label: 'Sleep',
      value: sleepHours ?? 0,
      max: 9,
      color: '#8b5cf6',
      trackColor: '#ede9fe',
      icon: <Moon className="h-5 w-5" />,
      unit: 'hrs',
      displayValue: sleepHours ? `${sleepHours}h` : '—',
    },
    {
      label: 'Water',
      value: waterMl ?? 0,
      max: 2500,
      color: '#06b6d4',
      trackColor: '#cffafe',
      icon: <Droplets className="h-5 w-5" />,
      unit: 'ml',
      displayValue: waterMl ? `${Math.round(waterMl / 100) / 10}L` : '—',
    },
    {
      label: 'Calories',
      value: caloriesBurned ?? 0,
      max: 500,
      color: '#f97316',
      trackColor: '#ffedd5',
      icon: <Flame className="h-5 w-5" />,
      unit: 'kcal',
      displayValue: caloriesBurned ? `${caloriesBurned}` : '—',
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-gray-900">Today's Rings</p>
      <div className="flex items-start justify-around gap-2 flex-wrap">
        {rings.map(ring => (
          <Ring key={ring.label} {...ring} />
        ))}
      </div>
    </div>
  );
}

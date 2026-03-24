'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '@/lib/financeData';
import { formatINR } from '@/lib/currency';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#a855f7',
  '#14b8a6', '#e11d48', '#0284c7',
];

const EXCLUDED = ['Opening Balance', 'Balance Adjustment', 'Transfer', 'Investment', 'Loan'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1C1F26] px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800 dark:text-white">{name}</p>
      <p className="text-emerald-600 font-bold mt-0.5">{formatINR(value)}</p>
    </div>
  );
}

export default function ExpenseSplitChart({ transactions }: { transactions: Transaction[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const now = new Date();
  const data = useMemo(() => {
    const monthly = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense'
        && !EXCLUDED.includes(t.category)
        && d.getMonth() === now.getMonth()
        && d.getFullYear() === now.getFullYear();
    });
    const map = new Map<string, number>();
    monthly.forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount)));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const active = activeIndex !== null ? data[activeIndex] : null;

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#1C1F26] p-5 shadow-sm">
        <p className="text-sm text-gray-400">No expenses this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#1C1F26] p-5 shadow-sm h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expense Split</h3>
        <span className="text-xs text-gray-400">This month · {formatINR(total)}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut with centre label */}
        <div className="relative flex-none" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={86}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_: any, index: number) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {active ? (
              <>
                <p className="text-[11px] text-gray-400 leading-tight truncate max-w-[100px]">{active.name}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatINR(active.value)}</p>
                <p className="text-[11px] text-gray-400">{((active.value / total) * 100).toFixed(1)}%</p>
              </>
            ) : (
              <>
                <p className="text-[11px] text-gray-400">Total</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatINR(total)}</p>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 min-w-0 space-y-1.5 overflow-y-auto" style={{ maxHeight: 200 }}>
          {data.map((item, i) => (
            <button
              key={item.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(i === activeIndex ? null : i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                activeIndex === i ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
              <span className="flex-none text-xs font-semibold text-gray-500 dark:text-gray-400">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
              <span className="flex-none text-sm font-bold text-gray-900 dark:text-white w-20 text-right">
                {formatINR(item.value)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
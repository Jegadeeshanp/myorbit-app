'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Transaction } from '@/lib/financeData';
import { formatINR } from '@/lib/currency';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#a855f7',
  '#14b8a6', '#e11d48', '#0284c7',
];

// Exclude system/non-real-expense categories
const EXCLUDED = ['Opening Balance', 'Balance Adjustment', 'Transfer', 'Investment', 'Loan'];

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 16} textAnchor="middle" fill="#e5e7eb" fontSize={12} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#f9fafb" fontSize={15} fontWeight={700}>
        {formatINR(value)}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#9ca3af" fontSize={11}>
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 13}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

export default function ExpenseSplitChart({ transactions }: { transactions: Transaction[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#1C1F26] p-5 shadow-sm">
        <p className="text-sm text-gray-400">No expenses this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-[#1C1F26] p-5 shadow-sm h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expense Split</h3>
        <span className="text-xs text-gray-400">This month · {formatINR(total)}</span>
      </div>

      {/* Chart + Legend side by side, properly aligned */}
      <div className="flex items-center gap-6">
        {/* Donut chart — fixed size, flex-none */}
        <div className="flex-none" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={ActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={86}
                dataKey="value"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend — takes remaining space, vertically centered */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2">
            {data.map((item, i) => (
              <button
                key={item.name}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                  activeIndex === i
                    ? 'bg-gray-100 dark:bg-white/10'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
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
    </div>
  );
}
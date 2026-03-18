'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, ChevronDown } from 'lucide-react';

type Task = {
  id: string; title: string; dueDate?: string; status: string;
};

type CalView = 'year' | 'month' | 'week' | 'day' | 'agenda' | '2weeks';

interface Props {
  tasks: Task[];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeeksForView(refDate: Date, numWeeks: number) {
  // Start from the Monday of the week containing refDate
  const start = new Date(refDate);
  const dow = start.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diffToMon);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks: {
    weekNum: number;
    days: { date: Date; dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean }[];
  }[] = [];

  for (let w = 0; w < numWeeks; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      day.setHours(0, 0, 0, 0);
      const dateStr = day.toISOString().split('T')[0];
      days.push({
        date: day,
        dateStr,
        dayNum: day.getDate(),
        isToday: day.getTime() === today.getTime(),
        isCurrentMonth: day.getMonth() === refDate.getMonth(),
      });
    }
    weeks.push({ weekNum: getWeekNumber(days[0].date), days });
  }
  return weeks;
}

const VIEW_WEEKS: Record<CalView, number> = {
  '2weeks': 2,
  'week': 1,
  'month': 5,
  'year': 1,
  'day': 1,
  'agenda': 1,
};

const VIEW_LABELS: { key: CalView; label: string }[] = [
  { key: 'year',    label: 'Year' },
  { key: 'month',   label: 'Month' },
  { key: 'week',    label: 'Week' },
  { key: 'day',     label: 'Day' },
  { key: 'agenda',  label: 'Agenda' },
];

export default function TaskCalendar({ tasks }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calView, setCalView]         = useState<CalView>('2weeks');

  const numWeeks = VIEW_WEEKS[calView] ?? 2;

  const weeks = useMemo(() => getWeeksForView(currentDate, numWeeks), [currentDate, numWeeks]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    }
    return map;
  }, [tasks]);

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * numWeeks * 7);
    setCurrentDate(d);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-[#252525] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 flex-none">
        <h2 className="text-xl font-bold flex-1">{monthName}</h2>
        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition">
          <Plus className="h-4 w-4" />
        </button>
        {/* View selector dropdown (cosmetic) */}
        <div className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 cursor-pointer hover:bg-white/15 transition">
          <span className="text-sm font-medium">
            {calView === '2weeks' ? '2 Weeks' : calView.charAt(0).toUpperCase() + calView.slice(1)}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/10 font-medium hover:bg-white/15 transition"
        >
          Today
        </button>
        <button
          onClick={() => navigate(1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-4">
        {/* Day header row */}
        <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-px mb-2">
          <div />
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map(week => (
          <div key={week.weekNum} className="grid grid-cols-[40px_repeat(7,1fr)] gap-px mb-1">
            <div className="text-[10px] text-gray-600 pt-2 text-right pr-2 leading-none">W{week.weekNum}</div>
            {week.days.map(day => {
              const dayTasks = tasksByDate[day.dateStr] || [];
              return (
                <div
                  key={day.dateStr}
                  className={`border rounded-lg p-1.5 min-h-[90px] ${
                    day.isToday
                      ? 'border-sky-500/40 bg-sky-900/10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  } transition`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isToday
                      ? 'text-sky-400'
                      : day.isCurrentMonth
                      ? 'text-gray-200'
                      : 'text-gray-600'
                  }`}>
                    {day.isToday ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white text-xs">
                        {day.dayNum}
                      </span>
                    ) : (
                      day.dayNum
                    )}
                  </div>
                  {dayTasks.slice(0, 2).map(t => (
                    <div
                      key={t.id}
                      className="text-[11px] text-gray-300 truncate rounded px-1 py-0.5 mb-0.5 bg-white/5 hover:bg-white/10 cursor-pointer transition"
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-[10px] text-gray-500 px-1">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom view switcher */}
      <div className="flex items-center justify-center gap-1 py-3 border-t border-white/5 flex-none">
        {VIEW_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCalView(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              calView === key
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

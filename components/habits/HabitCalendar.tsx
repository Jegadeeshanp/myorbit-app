'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type HabitForCalendar = {
  id: string;
  name: string;
  color: string;
  iconEmoji: string;
  isActive: boolean;
  logs: { logDate: string; value: number }[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Mon=0
}

function getDaysInYear(year: number): number {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getWeekDays(weekOffset = 0): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

type CalendarDayStatus = 'all' | 'some' | 'none';

function getDayStatus(date: string, habits: HabitForCalendar[]): CalendarDayStatus {
  const activeHabits = habits.filter(h => h.isActive);
  if (activeHabits.length === 0) return 'none';
  const done = activeHabits.filter(h => h.logs.some(l => l.logDate === date)).length;
  if (done === 0) return 'none';
  if (done === activeHabits.length) return 'all';
  return 'some';
}

function getDayStatusColor(status: CalendarDayStatus): string {
  if (status === 'all') return 'bg-emerald-500';
  if (status === 'some') return 'bg-amber-400';
  return 'bg-gray-200 dark:bg-gray-700';
}

// ── Day Popup ────────────────────────────────────────────────────────────────

function DayPopup({ date, habits, onClose }: { date: string; habits: HabitForCalendar[]; onClose: () => void }) {
  const [d, m, y] = (() => {
    const dt = new Date(date + 'T12:00:00');
    return [dt.getDate(), dt.toLocaleString('default', { month: 'long' }), dt.getFullYear()];
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-semibold text-gray-900 dark:text-white">{m} {d}, {y}</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {habits.map(h => {
            const done = h.logs.some(l => l.logDate === date);
            return (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-base">{h.iconEmoji}</span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{h.name}</span>
                <span className={`text-sm font-medium ${done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
                  {done ? '✅' : '⬜'}
                </span>
              </div>
            );
          })}
          {habits.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No habits tracked yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────────────────────────────

function WeekView({ habits }: { habits: HabitForCalendar[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = getTodayString();
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {new Date(days[0] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(days[6] + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              Today
            </button>
          )}
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1 pr-3 text-gray-400 dark:text-gray-500 font-medium w-28">Habit</th>
              {days.map((d, i) => {
                const isToday = d === today;
                const dt = new Date(d + 'T12:00:00');
                return (
                  <th key={d} className={`text-center py-1 px-1 font-medium min-w-[36px] ${isToday ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    <div>{DAY_LABELS[i]}</div>
                    <div className={`text-[10px] ${isToday ? 'font-bold' : 'font-normal opacity-70'}`}>{dt.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => {
              const logSet = new Set(h.logs.map(l => l.logDate));
              return (
                <tr key={h.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3 truncate max-w-[112px]">
                    <span className="mr-1">{h.iconEmoji}</span>
                    <span className="text-gray-700 dark:text-gray-300">{h.name}</span>
                  </td>
                  {days.map(d => {
                    const done = logSet.has(d);
                    return (
                      <td key={d} className="text-center py-2 px-1">
                        <div
                          className={`mx-auto h-5 w-5 rounded-full ${done ? '' : 'bg-gray-100 dark:bg-gray-800'}`}
                          style={done ? { backgroundColor: h.color } : {}}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No habits to display</p>
        )}
      </div>
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────────────────────

function MonthView({ habits }: { habits: HabitForCalendar[] }) {
  const [offset, setOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const now = new Date();
  const year = new Date(now.getFullYear(), now.getMonth() + offset, 1).getFullYear();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1).getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateStr(year, month, i + 1)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              Today
            </button>
          )}
          <button onClick={() => setOffset(o => o + 1)} disabled={offset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{l}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const status = getDayStatus(d, habits);
          const isToday = d === today;
          const isFuture = d > today;
          return (
            <button
              key={d}
              onClick={() => !isFuture && setPopupDate(d)}
              disabled={isFuture}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition text-xs font-medium
                ${isToday ? 'ring-2 ring-amber-400' : ''}
                ${isFuture ? 'opacity-30 cursor-default' : 'hover:opacity-80 cursor-pointer'}
              `}
            >
              <span className={`text-[11px] ${isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                {new Date(d + 'T12:00:00').getDate()}
              </span>
              {!isFuture && (
                <div className={`h-2 w-2 rounded-full ${getDayStatusColor(status)}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500 dark:text-gray-400">All done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-xs text-gray-500 dark:text-gray-400">Some done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-gray-700" /><span className="text-xs text-gray-500 dark:text-gray-400">None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Year View ────────────────────────────────────────────────────────────────

function YearView({ habits }: { habits: HabitForCalendar[] }) {
  const [yearOffset, setYearOffset] = useState(0);
  const [popupDate, setPopupDate] = useState<string | null>(null);
  const today = getTodayString();
  const currentYear = new Date().getFullYear() + yearOffset;
  const totalDays = getDaysInYear(currentYear);

  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(currentYear, 0, i + 1);
      return d.toISOString().split('T')[0];
    });
  }, [currentYear, totalDays]);

  const jan1DayOfWeek = useMemo(() => {
    const day = new Date(currentYear, 0, 1).getDay();
    return (day + 6) % 7;
  }, [currentYear]);

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const paddedDays: (string | null)[] = [
    ...Array(jan1DayOfWeek).fill(null),
    ...days,
  ];
  const numWeeks = Math.ceil(paddedDays.length / 7);
  const weeks: (string | null)[][] = Array.from({ length: numWeeks }, (_, wi) =>
    paddedDays.slice(wi * 7, wi * 7 + 7)
  );

  const monthPositions = MONTH_LABELS.map((_, mi) => {
    const firstOfMonth = new Date(currentYear, mi, 1).toISOString().split('T')[0];
    const dayIndex = days.indexOf(firstOfMonth);
    if (dayIndex < 0) return { label: MONTH_LABELS[mi], col: 0 };
    const col = Math.floor((dayIndex + jan1DayOfWeek) / 7);
    return { label: MONTH_LABELS[mi], col };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{currentYear}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setYearOffset(o => o - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {yearOffset !== 0 && (
            <button onClick={() => setYearOffset(0)} className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
              This Year
            </button>
          )}
          <button onClick={() => setYearOffset(o => o + 1)} disabled={yearOffset >= 0} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels row */}
          <div className="flex mb-1" style={{ paddingLeft: '14px' }}>
            {weeks.map((_, wi) => {
              const mp = monthPositions.find(m => m.col === wi);
              return (
                <div key={wi} className="w-[13px] mr-[2px] text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none">
                  {mp ? mp.label : ''}
                </div>
              );
            })}
          </div>

          {/* Day rows (Mon–Sun) */}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="flex items-center mb-[2px]">
              <div className="w-[12px] mr-[2px] text-[8px] text-gray-400 dark:text-gray-500 leading-none">
                {row % 2 === 0 ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'][row] : ''}
              </div>
              {weeks.map((week, wi) => {
                const d = week[row];
                if (!d) return <div key={wi} className="w-[11px] h-[11px] mr-[2px]" />;
                const isFuture = d > today;
                const status = isFuture ? 'none' : getDayStatus(d, habits);
                const isToday = d === today;
                return (
                  <button
                    key={wi}
                    onClick={() => !isFuture && setPopupDate(d)}
                    disabled={isFuture}
                    title={d}
                    className={`w-[11px] h-[11px] mr-[2px] rounded-sm transition
                      ${getDayStatusColor(status)}
                      ${isFuture ? 'opacity-30 cursor-default' : 'hover:opacity-70 cursor-pointer'}
                      ${isToday ? 'ring-1 ring-amber-400' : ''}
                    `}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="text-xs text-gray-500 dark:text-gray-400">All done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-amber-400" /><span className="text-xs text-gray-500 dark:text-gray-400">Some done</span></div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-gray-700" /><span className="text-xs text-gray-500 dark:text-gray-400">None</span></div>
      </div>

      {popupDate && <DayPopup date={popupDate} habits={habits} onClose={() => setPopupDate(null)} />}
    </div>
  );
}

// ── Calendar Section (exported) ──────────────────────────────────────────────

export default function HabitCalendar({ habits }: { habits: HabitForCalendar[] }) {
  const [view, setView] = useState<'week' | 'month' | 'year'>('month');

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Habit Calendar</h2>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['week', 'month', 'year'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                view === v
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'week' && <WeekView habits={habits} />}
      {view === 'month' && <MonthView habits={habits} />}
      {view === 'year' && <YearView habits={habits} />}
    </div>
  );
}

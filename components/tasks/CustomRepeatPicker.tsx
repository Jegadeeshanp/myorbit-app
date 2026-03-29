'use client';

import { useState } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
export const WEEKDAY_SHORT  = ['S','M','T','W','T','F','S'];
export const WEEKDAY_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const WEEKDAY_VALUES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
export const ORDINAL_VALUES = ['first','second','third','fourth','last'];
export const ORDINAL_LABELS = ['First','Second','Third','Fourth','Last'];
export const MONTH_NAMES    = ['January','February','March','April','May','June',
                               'July','August','September','October','November','December'];

// ── Types ────────────────────────────────────────────────────────────────────
export type ParsedCustom =
  | { period: 'week';  weekDays: number[] }
  | { period: 'month'; mode: 'each';  days: number[] }
  | { period: 'month'; mode: 'onthe'; ordinal: string; weekday: string }
  | { period: 'year';  mode: 'each';  month: number; day: number }
  | { period: 'year';  mode: 'onthe'; month: number; ordinal: string; weekday: string };

// ── Helpers ──────────────────────────────────────────────────────────────────
export function parseCustomRepeat(v: string): ParsedCustom {
  const fallback: ParsedCustom = { period: 'week', weekDays: [] };
  if (!v.startsWith('custom:')) return fallback;
  const rest  = v.slice(7);
  const parts = rest.split(':');
  if (parts[0] === 'week') {
    return { period: 'week', weekDays: (parts[1]??'').split(',').map(Number).filter(n=>!isNaN(n)&&n>=0&&n<=6) };
  }
  if (parts[0] === 'month') {
    if (parts[1] === 'each') {
      const days = (parts[2]??'').split(',').map(d => d==='last' ? -1 : Number(d)).filter(d=>d===-1||(d>=1&&d<=31));
      return { period: 'month', mode: 'each', days };
    }
    if (parts[1] === 'onthe') return { period: 'month', mode: 'onthe', ordinal: parts[2]??'first', weekday: parts[3]??'monday' };
  }
  if (parts[0] === 'year') {
    if (parts[1] === 'each')  return { period: 'year', mode: 'each',  month: Number(parts[2])||1, day: Number(parts[3])||1 };
    if (parts[1] === 'onthe') return { period: 'year', mode: 'onthe', month: Number(parts[2])||1, ordinal: parts[3]??'first', weekday: parts[4]??'monday' };
  }
  // Backward compat: "custom:0,1,5" → weekly
  const legacyDays = rest.split(',').map(Number).filter(n=>!isNaN(n)&&n>=0&&n<=6);
  return { period: 'week', weekDays: legacyDays };
}

export function buildCustomLabel(v: string): string {
  if (!v.startsWith('custom:')) return 'Custom';
  const p = parseCustomRepeat(v);
  if (p.period === 'week') {
    const names = p.weekDays.map(d => WEEKDAY_SHORT[d]).join(' ');
    return names || 'Custom';
  }
  if (p.period === 'month') {
    if (p.mode === 'each') {
      const labels = p.days.map(d => d===-1 ? 'Last' : String(d)).join(', ');
      return labels || 'Monthly';
    }
    const ord = ORDINAL_LABELS[ORDINAL_VALUES.indexOf(p.ordinal)] ?? p.ordinal;
    const wd  = WEEKDAY_FULL[WEEKDAY_VALUES.indexOf(p.weekday)]?.slice(0,3) ?? p.weekday;
    return `${ord} ${wd}`;
  }
  if (p.period === 'year') {
    if (p.mode === 'each') {
      const mon = MONTH_NAMES[p.month - 1]?.slice(0,3) ?? '';
      return `${mon} ${p.day}`;
    }
    const mon = MONTH_NAMES[p.month - 1]?.slice(0,3) ?? '';
    const ord = ORDINAL_LABELS[ORDINAL_VALUES.indexOf(p.ordinal)] ?? p.ordinal;
    const wd  = WEEKDAY_FULL[WEEKDAY_VALUES.indexOf(p.weekday)]?.slice(0,3) ?? p.weekday;
    return `${ord} ${wd} · ${mon}`;
  }
  return 'Custom';
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CustomRepeatPicker({ initialValue, onSave, onCancel }: {
  initialValue: string; onSave: (v: string) => void; onCancel: () => void;
}) {
  const parsed = parseCustomRepeat(initialValue);
  const today  = new Date();

  const [period, setPeriod]           = useState<'week'|'month'|'year'>(parsed.period);
  // Week
  const [weekDays, setWeekDays]       = useState<number[]>(parsed.period==='week' ? parsed.weekDays : []);
  // Month
  const [monthMode, setMonthMode]     = useState<'each'|'onthe'>(parsed.period==='month' ? parsed.mode : 'each');
  const [monthDays, setMonthDays]     = useState<number[]>(parsed.period==='month'&&parsed.mode==='each' ? parsed.days : []);
  const [monthOrdinal, setMonthOrdinal] = useState(parsed.period==='month'&&parsed.mode==='onthe' ? parsed.ordinal : 'first');
  const [monthWeekday, setMonthWeekday] = useState(parsed.period==='month'&&parsed.mode==='onthe' ? parsed.weekday : 'monday');
  // Year
  const [yearMode, setYearMode]       = useState<'each'|'onthe'>(parsed.period==='year' ? parsed.mode : 'each');
  const [yearMonth, setYearMonth]     = useState(parsed.period==='year' ? parsed.month : today.getMonth()+1);
  const [yearDay, setYearDay]         = useState(parsed.period==='year'&&parsed.mode==='each' ? parsed.day : today.getDate());
  const [yearOntheMonth, setYearOntheMonth] = useState(parsed.period==='year'&&parsed.mode==='onthe' ? parsed.month : today.getMonth()+1);
  const [yearOrdinal, setYearOrdinal] = useState(parsed.period==='year'&&parsed.mode==='onthe' ? parsed.ordinal : 'first');
  const [yearWeekday, setYearWeekday] = useState(parsed.period==='year'&&parsed.mode==='onthe' ? parsed.weekday : 'monday');

  const toggleWD = (d: number) => setWeekDays(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d].sort((a,b)=>a-b));
  const toggleMD = (d: number) => setMonthDays(p => p.includes(d) ? p.filter(x=>x!==d) : [...p,d].sort((a,b)=>a-b));
  const daysInYM = new Date(today.getFullYear(), yearMonth, 0).getDate();

  const buildValue = (): string => {
    if (period==='week')  return `custom:week:${weekDays.join(',')}`;
    if (period==='month') {
      if (monthMode==='each') return `custom:month:each:${monthDays.map(d=>d===-1?'last':String(d)).join(',')||'1'}`;
      return `custom:month:onthe:${monthOrdinal}:${monthWeekday}`;
    }
    if (yearMode==='each') return `custom:year:each:${yearMonth}:${yearDay}`;
    return `custom:year:onthe:${yearOntheMonth}:${yearOrdinal}:${yearWeekday}`;
  };

  const selCls = 'flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-400';
  const tabCls = (on: boolean) => `flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${on ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`;
  const wdCls  = (on: boolean) => `flex-1 h-9 rounded-lg text-xs font-bold transition ${on ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`;
  const numCls = (on: boolean) => `h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition ${on ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Period tabs */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['week','month','year'] as const).map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={tabCls(period===p)}>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 min-h-[14rem]">
        {/* ── WEEK ── */}
        {period==='week' && (
          <>
            <p className="text-[11px] font-medium text-gray-400 mb-3">Days of the week</p>
            <div className="flex gap-1.5">
              {WEEKDAY_SHORT.map((lbl, day) => (
                <button key={day} type="button" onClick={() => toggleWD(day)} className={wdCls(weekDays.includes(day))}>{lbl}</button>
              ))}
            </div>
          </>
        )}

        {/* ── MONTH ── */}
        {period==='month' && (
          <>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
              <button type="button" onClick={() => setMonthMode('each')}  className={tabCls(monthMode==='each')}>Each</button>
              <button type="button" onClick={() => setMonthMode('onthe')} className={tabCls(monthMode==='onthe')}>On the</button>
            </div>
            {monthMode==='each' && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({length:31},(_,i)=>i+1).map(d => (
                  <button key={d} type="button" onClick={() => toggleMD(d)} className={numCls(monthDays.includes(d))}>{d}</button>
                ))}
                <button type="button" onClick={() => toggleMD(-1)}
                  className={`col-span-3 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition ${monthDays.includes(-1) ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  Last Day
                </button>
              </div>
            )}
            {monthMode==='onthe' && (
              <div className="flex gap-2">
                <select value={monthOrdinal} onChange={e => setMonthOrdinal(e.target.value)} className={selCls}>
                  {ORDINAL_VALUES.map((o,i) => <option key={o} value={o}>{ORDINAL_LABELS[i]}</option>)}
                </select>
                <select value={monthWeekday} onChange={e => setMonthWeekday(e.target.value)} className={selCls}>
                  {WEEKDAY_VALUES.map((w,i) => <option key={w} value={w}>{WEEKDAY_FULL[i]}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        {/* ── YEAR ── */}
        {period==='year' && (
          <>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
              <button type="button" onClick={() => setYearMode('each')}  className={tabCls(yearMode==='each')}>Each</button>
              <button type="button" onClick={() => setYearMode('onthe')} className={tabCls(yearMode==='onthe')}>On the</button>
            </div>
            {yearMode==='each' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setYearMonth(m => m===1?12:m-1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-base">‹</button>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{MONTH_NAMES[yearMonth-1]}</span>
                  <button type="button" onClick={() => setYearMonth(m => m===12?1:m+1)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-base">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length:daysInYM},(_,i)=>i+1).map(d => (
                    <button key={d} type="button" onClick={() => setYearDay(d)} className={numCls(yearDay===d)}>{d}</button>
                  ))}
                </div>
              </>
            )}
            {yearMode==='onthe' && (
              <div className="space-y-2">
                <select value={yearOntheMonth} onChange={e => setYearOntheMonth(Number(e.target.value))} className={selCls}>
                  {MONTH_NAMES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <div className="flex gap-2">
                  <select value={yearOrdinal} onChange={e => setYearOrdinal(e.target.value)} className={selCls}>
                    {ORDINAL_VALUES.map((o,i) => <option key={o} value={o}>{ORDINAL_LABELS[i]}</option>)}
                  </select>
                  <select value={yearWeekday} onChange={e => setYearWeekday(e.target.value)} className={selCls}>
                    {WEEKDAY_VALUES.map((w,i) => <option key={w} value={w}>{WEEKDAY_FULL[i]}</option>)}
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel / OK */}
      <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 px-4 py-3">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button type="button" onClick={() => onSave(buildValue())}
          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500">
          OK
        </button>
      </div>
    </div>
  );
}

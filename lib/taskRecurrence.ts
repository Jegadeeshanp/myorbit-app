/**
 * lib/taskRecurrence.ts
 * Server-safe (no browser APIs) utility for computing the next occurrence date
 * of a recurring task based on its repeat tag value.
 *
 * Tag format stored in task.tags JSON array:
 *   "repeat:daily"
 *   "repeat:weekly"
 *   "repeat:monthly"
 *   "repeat:yearly"
 *   "repeat:weekdays"          → Mon–Fri
 *   "repeat:weekend"           → Sat–Sun
 *   "repeat:custom:week:0,1,5" → specific weekdays (0=Sun…6=Sat)
 *   "repeat:custom:month:each:1,15"           → specific days of month
 *   "repeat:custom:month:onthe:first:monday"  → Nth weekday of month
 *   "repeat:custom:year:each:3:15"            → specific month+day each year
 *   "repeat:custom:year:onthe:3:first:monday" → Nth weekday of a month each year
 */

const WEEKDAY_VALUES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const ORDINAL_VALUES = ['first','second','third','fourth','last'];

/** Returns the date string YYYY-MM-DD for `d` in local time. */
function fmt(d: Date): string {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
}

/** Add `n` days to `d` (mutates and returns). */
function addDays(d: Date, n: number): Date {
  d.setDate(d.getDate() + n); return d;
}

// ── Custom repeat parsers ──────────────────────────────────────────────────

function nextCustomWeek(current: Date, parts: string[]): Date | null {
  const weekDays = (parts[0] ?? '').split(',').map(Number).filter(n => n >= 0 && n <= 6);
  if (!weekDays.length) return null;
  const sorted = [...new Set(weekDays)].sort((a, b) => a - b);
  const next = new Date(current); addDays(next, 1);
  // Scan up to 7 days to find the next matching weekday
  for (let i = 0; i < 7; i++) {
    if (sorted.includes(next.getDay())) return next;
    addDays(next, 1);
  }
  return null;
}

function nextCustomMonthEach(current: Date, parts: string[]): Date | null {
  // days: comma-separated ints (1–31) or "last" (stored as -1)
  const days = (parts[0] ?? '').split(',')
    .map(d => d === 'last' ? -1 : parseInt(d, 10))
    .filter(d => d === -1 || (d >= 1 && d <= 31));
  if (!days.length) return null;

  // Try this month and the next two months
  for (let mOffset = 0; mOffset <= 2; mOffset++) {
    const year  = current.getFullYear() + Math.floor((current.getMonth() + mOffset) / 12);
    const month = (current.getMonth() + mOffset) % 12;
    const lastDay = new Date(year, month + 1, 0).getDate();

    const resolved = days
      .map(d => d === -1 ? lastDay : d)
      .filter(d => d >= 1 && d <= lastDay)
      .sort((a, b) => a - b);

    for (const day of resolved) {
      const candidate = new Date(year, month, day);
      if (candidate > current) return candidate;
    }
  }
  return null;
}

function nthWeekdayOfMonth(year: number, month: number, ordinal: string, weekday: string): Date | null {
  const dow = WEEKDAY_VALUES.indexOf(weekday); // 0=Sun…6=Sat
  if (dow < 0) return null;

  if (ordinal === 'last') {
    const lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== dow) lastDay.setDate(lastDay.getDate() - 1);
    return lastDay;
  }

  const ordIdx = ORDINAL_VALUES.indexOf(ordinal); // 0=first…3=fourth
  if (ordIdx < 0) return null;

  let count = 0;
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === dow) { if (count === ordIdx) return new Date(d); count++; }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function nextCustomMonthOnthe(current: Date, parts: string[]): Date | null {
  const [ordinal, weekday] = parts;
  if (!ordinal || !weekday) return null;

  for (let mOffset = 0; mOffset <= 13; mOffset++) {
    const year  = current.getFullYear() + Math.floor((current.getMonth() + mOffset) / 12);
    const month = (current.getMonth() + mOffset) % 12;
    const candidate = nthWeekdayOfMonth(year, month, ordinal, weekday);
    if (candidate && candidate > current) return candidate;
  }
  return null;
}

function nextCustomYearEach(current: Date, parts: string[]): Date | null {
  const month = parseInt(parts[0], 10) - 1; // 0-based
  const day   = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  for (let yOffset = 0; yOffset <= 2; yOffset++) {
    const candidate = new Date(current.getFullYear() + yOffset, month, day);
    if (candidate > current) return candidate;
  }
  return null;
}

function nextCustomYearOnthe(current: Date, parts: string[]): Date | null {
  const month   = parseInt(parts[0], 10) - 1; // 0-based
  const ordinal = parts[1];
  const weekday = parts[2];
  if (isNaN(month) || !ordinal || !weekday) return null;

  for (let yOffset = 0; yOffset <= 2; yOffset++) {
    const year = current.getFullYear() + yOffset;
    const candidate = nthWeekdayOfMonth(year, month, ordinal, weekday);
    if (candidate && candidate > current) return candidate;
  }
  return null;
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Given the current task's dueDate (YYYY-MM-DD) and the repeat tag value
 * (without the "repeat:" prefix), returns the next occurrence date as
 * YYYY-MM-DD, or null if the repeat value is unrecognised / none.
 */
export function nextOccurrenceDate(currentDate: string, repeatValue: string): string | null {
  if (!repeatValue || repeatValue === 'none') return null;

  const base = new Date(`${currentDate}T00:00:00`);

  // ── Simple repeats ───────────────────────────────────────────────────────
  if (repeatValue === 'daily') {
    return fmt(addDays(new Date(base), 1));
  }
  if (repeatValue === 'weekly') {
    return fmt(addDays(new Date(base), 7));
  }
  if (repeatValue === 'monthly') {
    const d = new Date(base); d.setMonth(d.getMonth() + 1); return fmt(d);
  }
  if (repeatValue === 'yearly') {
    const d = new Date(base); d.setFullYear(d.getFullYear() + 1); return fmt(d);
  }
  if (repeatValue === 'weekdays') {
    const d = new Date(base); addDays(d, 1);
    while (d.getDay() === 0 || d.getDay() === 6) addDays(d, 1);
    return fmt(d);
  }
  if (repeatValue === 'weekend') {
    const d = new Date(base); addDays(d, 1);
    while (d.getDay() !== 0 && d.getDay() !== 6) addDays(d, 1);
    return fmt(d);
  }

  // ── Custom repeats ───────────────────────────────────────────────────────
  if (repeatValue.startsWith('custom:')) {
    const rest  = repeatValue.slice(7); // strip "custom:"
    const parts = rest.split(':');
    const period = parts[0];
    const subparts = parts.slice(2); // after period + mode

    let result: Date | null = null;

    if (period === 'week') {
      result = nextCustomWeek(base, parts.slice(1));
    } else if (period === 'month' && parts[1] === 'each') {
      result = nextCustomMonthEach(base, subparts);
    } else if (period === 'month' && parts[1] === 'onthe') {
      result = nextCustomMonthOnthe(base, subparts);
    } else if (period === 'year' && parts[1] === 'each') {
      result = nextCustomYearEach(base, subparts);
    } else if (period === 'year' && parts[1] === 'onthe') {
      result = nextCustomYearOnthe(base, subparts);
    }

    return result ? fmt(result) : null;
  }

  return null;
}

/**
 * Extracts the repeat value from a task's tags JSON string.
 * Returns the value after "repeat:" or null if not found.
 */
export function extractRepeatValue(tagsJson: string): string | null {
  try {
    const tags: string[] = JSON.parse(tagsJson || '[]');
    const tag = tags.find(t => t.startsWith('repeat:'));
    if (!tag) return null;
    const val = tag.slice('repeat:'.length);
    return val === 'none' ? null : val;
  } catch {
    return null;
  }
}

/**
 * Returns a copy of the tags JSON with snoozed-until tags stripped,
 * and status-related tags cleaned up for a fresh recurrence.
 */
export function tagsForRecurrence(tagsJson: string): string {
  try {
    const tags: string[] = JSON.parse(tagsJson || '[]');
    const cleaned = tags.filter(t => !t.startsWith('snoozed-until:'));
    return JSON.stringify(cleaned);
  } catch {
    return '[]';
  }
}

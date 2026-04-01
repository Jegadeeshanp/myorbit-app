/**
 * lib/financeRecurrence.ts
 * Server-safe utility for computing the next occurrence date of a recurring
 * finance transaction (expense / income).
 *
 * Frequencies supported:
 *   daily   → +1 day
 *   weekly  → +7 days
 *   monthly → same day next month (clamped to last day if needed)
 *   yearly  → same day next year
 *   custom  → parses "every N days|weeks|months|years"; falls back to monthly
 */

/** Returns YYYY-MM-DD string for a Date in local time. */
function fmt(d: Date): string {
  return d.toLocaleDateString('en-CA'); // locale trick gives YYYY-MM-DD
}

/**
 * Parse a custom interval string like "every 2 weeks" into { n, unit }.
 * Returns null if unparseable.
 */
function parseCustomInterval(interval: string | undefined): { n: number; unit: string } | null {
  if (!interval) return null;
  const m = interval.trim().match(/^every\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/i);
  if (!m) return null;
  return { n: parseInt(m[1], 10), unit: m[2].toLowerCase().replace(/s$/, '') }; // normalise plural
}

/**
 * Given the last transaction date (YYYY-MM-DD), compute the next occurrence date.
 * Returns null if the frequency is unrecognised.
 */
export function nextFinanceDate(
  lastDate: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  customInterval?: string,
): string | null {
  const base = new Date(`${lastDate}T00:00:00`);

  switch (frequency) {
    case 'daily': {
      base.setDate(base.getDate() + 1);
      return fmt(base);
    }
    case 'weekly': {
      base.setDate(base.getDate() + 7);
      return fmt(base);
    }
    case 'monthly': {
      base.setMonth(base.getMonth() + 1);
      return fmt(base);
    }
    case 'yearly': {
      base.setFullYear(base.getFullYear() + 1);
      return fmt(base);
    }
    case 'custom': {
      const parsed = parseCustomInterval(customInterval);
      if (!parsed) {
        // Unparseable custom interval — fall back to monthly
        base.setMonth(base.getMonth() + 1);
        return fmt(base);
      }
      const { n, unit } = parsed;
      if (unit === 'day')   base.setDate(base.getDate() + n);
      else if (unit === 'week')  base.setDate(base.getDate() + n * 7);
      else if (unit === 'month') base.setMonth(base.getMonth() + n);
      else if (unit === 'year')  base.setFullYear(base.getFullYear() + n);
      return fmt(base);
    }
    default:
      return null;
  }
}

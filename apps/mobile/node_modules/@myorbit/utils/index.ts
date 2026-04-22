/**
 * packages/utils/index.ts
 * Pure date/currency/grouping helpers shared across web and mobile.
 * No React imports. No Node.js-specific APIs. Safe for React Native.
 */

/** Subtract n days from a YYYY-MM-DD string, returns YYYY-MM-DD */
export function subDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Format YYYY-MM-DD → "12 Apr 2026" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Format a number as INR currency string */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

/** Return day of week 0–6 (Sunday=0) for a YYYY-MM-DD string */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

/** True if dateStr equals today's local date */
export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

/** True if dateStr is strictly before today */
export function isOverdue(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split('T')[0];
}

/** Group an array of items by their .date property */
export function groupByDate<T extends { date: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    (acc[item.date] = acc[item.date] ?? []).push(item);
    return acc;
  }, {});
}

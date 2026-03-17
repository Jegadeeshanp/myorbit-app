'use client';

// Shared localStorage-backed custom category store.
// Categories added in any modal automatically appear everywhere.
// Stores { name, icon } pairs so the chosen icon persists across modal re-opens.

const EXPENSE_KEY = 'myorbit:custom_expense_categories';
const INCOME_KEY  = 'myorbit:custom_income_categories';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Healthcare',
  'Entertainment', 'Education', 'Travel', 'Others',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Dividends', 'Rental Income',
  'Gifts', 'Refunds', 'Other Income',
];

export type StoredCategory = { name: string; icon: string };

function read(key: string): StoredCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    // Migrate old format (plain string[]) → new { name, icon } format
    const migrated: StoredCategory[] = (raw as any[]).map(item =>
      typeof item === 'string' ? { name: item, icon: 'Package' } : (item as StoredCategory)
    );
    // Deduplicate by name (keeps first occurrence — handles corrupted data from mixed formats)
    const seen = new Set<string>();
    return migrated.filter(c => seen.has(c.name) ? false : (seen.add(c.name), true));
  } catch {
    return [];
  }
}

function write(key: string, values: StoredCategory[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(values));
}

// ── Expense ────────────────────────────────────────────────────────────────

export function getCustomExpenseCategories(): string[] {
  return read(EXPENSE_KEY).map(c => c.name);
}

/** Returns custom (non-default) categories with their stored icon name. */
export function getCustomExpenseCategoryDefs(): StoredCategory[] {
  return read(EXPENSE_KEY);
}

export function getAllExpenseCategories(): string[] {
  const custom = read(EXPENSE_KEY).map(c => c.name);
  return [...DEFAULT_EXPENSE_CATEGORIES, ...custom.filter(c => !DEFAULT_EXPENSE_CATEGORIES.includes(c))];
}

export function addCustomExpenseCategory(name: string, iconName: string = 'Package'): void {
  const current = read(EXPENSE_KEY);
  if (!current.find(c => c.name === name) && !DEFAULT_EXPENSE_CATEGORIES.includes(name)) {
    write(EXPENSE_KEY, [...current, { name, icon: iconName }]);
  }
}

export function removeCustomExpenseCategory(name: string): void {
  write(EXPENSE_KEY, read(EXPENSE_KEY).filter(c => c.name !== name));
}

// ── Income ─────────────────────────────────────────────────────────────────

export function getCustomIncomeCategories(): string[] {
  return read(INCOME_KEY).map(c => c.name);
}

/** Returns custom (non-default) categories with their stored icon name. */
export function getCustomIncomeCategoryDefs(): StoredCategory[] {
  return read(INCOME_KEY);
}

export function getAllIncomeCategories(): string[] {
  const custom = read(INCOME_KEY).map(c => c.name);
  return [...DEFAULT_INCOME_CATEGORIES, ...custom.filter(c => !DEFAULT_INCOME_CATEGORIES.includes(c))];
}

export function addCustomIncomeCategory(name: string, iconName: string = 'Package'): void {
  const current = read(INCOME_KEY);
  if (!current.find(c => c.name === name) && !DEFAULT_INCOME_CATEGORIES.includes(name)) {
    write(INCOME_KEY, [...current, { name, icon: iconName }]);
  }
}

export function removeCustomIncomeCategory(name: string): void {
  write(INCOME_KEY, read(INCOME_KEY).filter(c => c.name !== name));
}

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

// ── DB sync helpers ─────────────────────────────────────────────────────────
// Call once on app mount to pull DB categories into localStorage.

export async function syncCategoriesFromDB(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) return;
    const cats: { name: string; type: string; icon: string }[] = await res.json();
    const expense = cats.filter(c => c.type === 'expense');
    const income  = cats.filter(c => c.type === 'income');
    // Merge into localStorage without removing existing
    const existingExpense = read(EXPENSE_KEY);
    const existingIncome  = read(INCOME_KEY);
    const mergedExpense = [...existingExpense];
    for (const c of expense) {
      if (!mergedExpense.find(e => e.name === c.name)) mergedExpense.push({ name: c.name, icon: c.icon || 'Package' });
    }
    const mergedIncome = [...existingIncome];
    for (const c of income) {
      if (!mergedIncome.find(e => e.name === c.name)) mergedIncome.push({ name: c.name, icon: c.icon || 'Package' });
    }
    write(EXPENSE_KEY, mergedExpense);
    write(INCOME_KEY, mergedIncome);
  } catch { /* silent */ }
}

export async function addCustomExpenseCategoryDB(name: string, iconName: string = 'Package'): Promise<void> {
  addCustomExpenseCategory(name, iconName);
  try { await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type: 'expense', icon: iconName }) }); } catch { /* silent */ }
}

export async function addCustomIncomeCategoryDB(name: string, iconName: string = 'Package'): Promise<void> {
  addCustomIncomeCategory(name, iconName);
  try { await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type: 'income', icon: iconName }) }); } catch { /* silent */ }
}

export async function removeCustomExpenseCategoryDB(id: string, name: string): Promise<void> {
  removeCustomExpenseCategory(name);
  try { await fetch(`/api/categories/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
}

export async function removeCustomIncomeCategoryDB(id: string, name: string): Promise<void> {
  removeCustomIncomeCategory(name);
  try { await fetch(`/api/categories/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
}

// ── Excluded Expense Categories ─────────────────────────────────────────────
// Categories whose transactions are hidden from expense totals (e.g. Investment)

const EXCLUDED_EXPENSE_KEY = 'myorbit:excluded_expense_categories';

export function getExcludedExpenseCategories(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(EXCLUDED_EXPENSE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function setExcludedExpenseCategories(cats: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXCLUDED_EXPENSE_KEY, JSON.stringify(cats));
}

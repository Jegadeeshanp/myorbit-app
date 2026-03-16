// Shared localStorage-backed custom category store.
// Custom categories added in any modal (expense, income) are persisted here
// and available across all modals and the categories manager.

const EXPENSE_KEY = 'myorbit_custom_expense_cats';
const INCOME_KEY  = 'myorbit_custom_income_cats';

function readList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

export function getCustomExpenseCategories(): string[] {
  return readList(EXPENSE_KEY);
}

export function getCustomIncomeCategories(): string[] {
  return readList(INCOME_KEY);
}

export function addCustomExpenseCategory(name: string): void {
  const cats = readList(EXPENSE_KEY);
  if (!cats.includes(name)) writeList(EXPENSE_KEY, [...cats, name]);
}

export function addCustomIncomeCategory(name: string): void {
  const cats = readList(INCOME_KEY);
  if (!cats.includes(name)) writeList(INCOME_KEY, [...cats, name]);
}

export function removeCustomExpenseCategory(name: string): void {
  writeList(EXPENSE_KEY, readList(EXPENSE_KEY).filter(c => c !== name));
}

export function removeCustomIncomeCategory(name: string): void {
  writeList(INCOME_KEY, readList(INCOME_KEY).filter(c => c !== name));
}

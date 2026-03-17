'use client';

// Shared localStorage-backed custom category store.
// Categories added in any modal automatically appear everywhere.

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

function read(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

function write(key: string, values: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(values));
}

export function getCustomExpenseCategories(): string[] {
  return read(EXPENSE_KEY);
}

export function getCustomIncomeCategories(): string[] {
  return read(INCOME_KEY);
}

export function getAllExpenseCategories(): string[] {
  const custom = read(EXPENSE_KEY);
  return [...DEFAULT_EXPENSE_CATEGORIES, ...custom.filter(c => !DEFAULT_EXPENSE_CATEGORIES.includes(c))];
}

export function getAllIncomeCategories(): string[] {
  const custom = read(INCOME_KEY);
  return [...DEFAULT_INCOME_CATEGORIES, ...custom.filter(c => !DEFAULT_INCOME_CATEGORIES.includes(c))];
}

export function addCustomExpenseCategory(name: string): void {
  const current = read(EXPENSE_KEY);
  if (!current.includes(name) && !DEFAULT_EXPENSE_CATEGORIES.includes(name)) {
    write(EXPENSE_KEY, [...current, name]);
  }
}

export function addCustomIncomeCategory(name: string): void {
  const current = read(INCOME_KEY);
  if (!current.includes(name) && !DEFAULT_INCOME_CATEGORIES.includes(name)) {
    write(INCOME_KEY, [...current, name]);
  }
}

export function removeCustomExpenseCategory(name: string): void {
  write(EXPENSE_KEY, read(EXPENSE_KEY).filter(c => c !== name));
}

export function removeCustomIncomeCategory(name: string): void {
  write(INCOME_KEY, read(INCOME_KEY).filter(c => c !== name));
}

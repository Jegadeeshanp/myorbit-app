import type { Account, Transaction, BudgetCategory } from '@/lib/financeData';

export const financeAccounts: Account[] = [
  { id: 'acc-bank', name: 'HDFC Bank', type: 'Bank', balance: 150000 },
  { id: 'acc-wallet', name: 'Cash Wallet', type: 'Wallet', balance: 5000 },
  { id: 'acc-credit', name: 'Axis Credit', type: 'Credit Card', balance: -42000, creditLimit: 100000 },
];

export const financeTransactions: Transaction[] = [
  {
    id: 'tx-income',
    date: '2026-04-01',
    category: 'Salary',
    description: 'Salary deposit',
    amount: 120000,
    type: 'income',
    accountId: 'acc-bank',
  },
  {
    id: 'tx-expense',
    date: '2026-04-02',
    category: 'Rent',
    description: 'April rent',
    amount: -25000,
    type: 'expense',
    accountId: 'acc-bank',
  },
  {
    id: 'tx-opening',
    date: '2026-04-01',
    category: 'Opening Balance',
    description: 'Opening balance',
    amount: 200000,
    type: 'opening_balance',
    accountId: 'acc-bank',
  },
];

export const financeBudgets: BudgetCategory[] = [
  { id: 'bd-1', name: 'Rent', budget: 25000, spent: 0, category: 'Rent' },
  { id: 'bd-2', name: 'Food', budget: 10000, spent: 0, category: 'Food' },
];

export function getFinanceFixture() {
  return {
    accounts: [...financeAccounts],
    transactions: [...financeTransactions],
    budgets: [...financeBudgets],
  };
}

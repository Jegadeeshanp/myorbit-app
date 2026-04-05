import { AssetCategory } from '@/lib/assetCategories';

export type Account = {
  id: string;
  name: string;
  type: 'Bank' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Wallet';
  balance: number;
};

export type Transaction = {
  id: string;
  date: string;
  category: string;
  description: string;
  notes?: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  accountId?: string;
  recurring?: RecurringConfig;
};

export type Asset = {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  invested: number;
  units?: number | null;
  accountId?: string;
  investmentType?: string;
  sipConfig?: SipConfig | null;
};

export type Liability = {
  id: string;
  name: string;
  lender?: string;
  borrowed: number;
  outstanding: number;
  monthlyEmi: number;
  nextDueDate?: string;
  emisLeft: number;
  totalRepaid: number;
  repaymentAccountId?: string;
};

export type BudgetCategory = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  category?: string;
};

export type Insight = {
  id: string;
  title: string;
  description: string;
};

export type RecurringConfig = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customInterval?: string;
  startDate: string;
  endType: string;
  endAfterTimes?: number;
  endDate?: string;
};

export type SipConfig = {
  frequency: string;
  startDate: string;
  endType: string;
  endAfterTimes?: number;
  endDate?: string;
};

export const accounts: Account[] = [
  { id: 'a1', name: 'HDFC Savings',      type: 'Bank',        balance: 15420 },
  { id: 'a2', name: 'SBI Savings',       type: 'Bank',        balance: 8200 },
  { id: 'a3', name: 'Cash Wallet',       type: 'Cash',        balance: 1200 },
  { id: 'a4', name: 'Axis Credit Card',  type: 'Credit Card', balance: -42000 },
];

export const transactions: Transaction[] = [
  { id: 't1', date: '2026-03-12', category: 'Food',      description: 'Dinner at the cafe',   amount: -420,   type: 'expense' },
  { id: 't2', date: '2026-03-11', category: 'Salary',    description: 'March paycheck',        amount: 85000,  type: 'income' },
  { id: 't3', date: '2026-03-09', category: 'Transport', description: 'Monthly metro pass',    amount: -1200,  type: 'expense' },
  { id: 't4', date: '2026-03-06', category: 'Shopping',  description: 'New headphones',        amount: -5900,  type: 'expense' },
];

export const assets: Asset[] = [
  { id: 'as1', name: 'Equity Stocks',  category: 'Stocks & Equity', value: 183000, invested: 130000 },
  { id: 'as2', name: 'Index Funds',    category: 'Mutual Funds',    value: 92000,  invested: 72000  },
  { id: 'as3', name: 'Apartment',      category: 'Real Estate',     value: 520000, invested: 310000 },
  { id: 'as4', name: 'Gold savings',   category: 'Gold & Silver',   value: 62000,  invested: 51000  },
];

export const liabilities: Liability[] = [
  { id: 'l1', name: 'Home Loan',   lender: 'SBI',  borrowed: 3000000, outstanding: 210000, monthlyEmi: 18500, nextDueDate: '2026-03-25', emisLeft: 12, totalRepaid: 2790000 },
  { id: 'l2', name: 'Car Loan',    lender: 'HDFC', borrowed: 500000,  outstanding: 72000,  monthlyEmi: 6200,  nextDueDate: '2026-03-20', emisLeft: 12, totalRepaid: 428000 },
  { id: 'l3', name: 'Credit Card', lender: 'Axis', borrowed: 42000,   outstanding: 42000,  monthlyEmi: 4500,  nextDueDate: '2026-03-18', emisLeft: 10, totalRepaid: 0 },
];

export const budgets: BudgetCategory[] = [
  { id: 'b1', name: 'Food',      budget: 12000, spent: 420 },
  { id: 'b2', name: 'Transport', budget: 6500,  spent: 1200 },
  { id: 'b3', name: 'Shopping',  budget: 11000, spent: 5900 },
  { id: 'b4', name: 'Bills',     budget: 9000,  spent: 0 },
];

export const insights: Insight[] = [
  { id: 'i1', title: 'Savings rate improved',    description: 'Your savings rate increased by 12% this month compared to last month.' },
  { id: 'i2', title: 'Investments growing',      description: 'Investments now represent 64% of your net worth.' },
  { id: 'i3', title: 'Expense alert',            description: 'You spent 18% more on food this month. Try reducing eating out to stay on budget.' },
];

export function calculateNetWorth() {
  const totalAssets      = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liab) => sum + liab.outstanding, 0);
  return totalAssets - totalLiabilities;
}

export function calculateMonthlySpending() {
  return Math.abs(transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0));
}
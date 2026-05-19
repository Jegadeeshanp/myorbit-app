import { apiRequest } from './client';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string | null;
  emoji: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface CreateTransactionInput {
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description?: string;
  date?: string;
}

export interface Asset {
  id: string;
  userId: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  createdAt: string;
}

export interface CreateAssetInput {
  name: string;
  type: string;
  value: number;
  currency?: string;
}

export interface Liability {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number | null;
  currency: string;
  createdAt: string;
}

export interface CreateLiabilityInput {
  name: string;
  type: string;
  balance: number;
  interestRate?: number;
  currency?: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: string;
  spent: number;
  createdAt: string;
}

export interface CreateBudgetInput {
  category: string;
  amount: number;
  period?: string;
}

export function getAccounts(): Promise<Account[]> {
  return apiRequest<Account[]>('/api/accounts');
}

export function updateAccount(id: string, input: Partial<{ name: string; balance: number; color: string; emoji: string }>): Promise<Account> {
  return apiRequest<Account>(`/api/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteAccount(id: string): Promise<void> {
  return apiRequest<void>(`/api/accounts/${id}`, { method: 'DELETE' });
}

export function getTransactions(params?: { accountId?: string; limit?: number; offset?: number }): Promise<Transaction[]> {
  const qs = new URLSearchParams();
  if (params?.accountId) qs.set('accountId', params.accountId);
  if (params?.limit)     qs.set('limit', String(params.limit));
  if (params?.offset)    qs.set('offset', String(params.offset));
  const q = qs.toString();
  return apiRequest<Transaction[]>(`/api/transactions${q ? `?${q}` : ''}`);
}

export function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return apiRequest<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(input) });
}

export function updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction> {
  return apiRequest<Transaction>(`/api/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteTransaction(id: string): Promise<void> {
  return apiRequest<void>(`/api/transactions/${id}`, { method: 'DELETE' });
}

export function getAssets(): Promise<Asset[]> {
  return apiRequest<Asset[]>('/api/assets');
}

export function createAsset(input: CreateAssetInput): Promise<Asset> {
  return apiRequest<Asset>('/api/assets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateAsset(id: string, input: Partial<CreateAssetInput>): Promise<Asset> {
  return apiRequest<Asset>(`/api/assets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteAsset(id: string): Promise<void> {
  return apiRequest<void>(`/api/assets/${id}`, { method: 'DELETE' });
}

export function getLiabilities(): Promise<Liability[]> {
  return apiRequest<Liability[]>('/api/liabilities');
}

export function createLiability(input: CreateLiabilityInput): Promise<Liability> {
  return apiRequest<Liability>('/api/liabilities', { method: 'POST', body: JSON.stringify(input) });
}

export function updateLiability(id: string, input: Partial<CreateLiabilityInput>): Promise<Liability> {
  return apiRequest<Liability>(`/api/liabilities/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteLiability(id: string): Promise<void> {
  return apiRequest<void>(`/api/liabilities/${id}`, { method: 'DELETE' });
}

export function getBudgets(): Promise<Budget[]> {
  return apiRequest<Budget[]>('/api/budgets');
}

export function createBudget(input: CreateBudgetInput): Promise<Budget> {
  return apiRequest<Budget>('/api/budgets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateBudget(id: string, input: Partial<CreateBudgetInput>): Promise<Budget> {
  return apiRequest<Budget>(`/api/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteBudget(id: string): Promise<void> {
  return apiRequest<void>(`/api/budgets/${id}`, { method: 'DELETE' });
}

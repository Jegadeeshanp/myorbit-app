import { apiRequest } from './client';
import type { Account, Transaction, CreateTransactionInput } from './types';

export const getAccounts = (): Promise<Account[]> =>
  apiRequest<Account[]>('/api/accounts');

export const getTransactions = (params?: {
  accountId?: string;
  month?: string;
}): Promise<Transaction[]> => {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null) as [string, string][]
      ).toString()
    : '';
  return apiRequest<Transaction[]>(`/api/transactions${qs}`);
};

export const createTransaction = (
  data: CreateTransactionInput
): Promise<Transaction> =>
  apiRequest<Transaction>('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteTransaction = (id: string): Promise<void> =>
  apiRequest<void>(`/api/transactions/${id}`, { method: 'DELETE' });

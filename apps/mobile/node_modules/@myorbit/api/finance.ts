import { apiRequest } from './client';
import type {
  Account, Transaction, CreateTransactionInput,
  Asset, Liability, CreateAssetInput, CreateLiabilityInput,
} from './types';

export const getAccounts = (): Promise<Account[]> =>
  apiRequest<Account[]>('/api/accounts');

export const updateAccount = (
  id: string,
  data: { balance?: number; name?: string; creditLimit?: number }
): Promise<Account> =>
  apiRequest<Account>(`/api/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

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

export const updateTransaction = (
  id: string,
  data: Partial<CreateTransactionInput>
): Promise<Transaction> =>
  apiRequest<Transaction>(`/api/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTransaction = (id: string): Promise<void> =>
  apiRequest<void>(`/api/transactions/${id}`, { method: 'DELETE' });

// ── Assets ────────────────────────────────────────────────────────────────────

export const getAssets = (): Promise<Asset[]> =>
  apiRequest<Asset[]>('/api/assets');

export const createAsset = (
  data: CreateAssetInput
): Promise<{ asset: Asset; fundingTransaction?: Transaction | null; updatedAccount?: Account | null }> =>
  apiRequest('/api/assets', { method: 'POST', body: JSON.stringify(data) });

export const updateAsset = (id: string, data: Partial<CreateAssetInput>): Promise<Asset> =>
  apiRequest<Asset>(`/api/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteAsset = (id: string): Promise<void> =>
  apiRequest<void>(`/api/assets/${id}`, { method: 'DELETE' });

// ── Liabilities ───────────────────────────────────────────────────────────────

export const getLiabilities = (): Promise<Liability[]> =>
  apiRequest<Liability[]>('/api/liabilities');

export const createLiability = (data: CreateLiabilityInput): Promise<Liability> =>
  apiRequest<Liability>('/api/liabilities', { method: 'POST', body: JSON.stringify(data) });

export const updateLiability = (
  id: string,
  data: Partial<CreateLiabilityInput> & { outstanding?: number; totalRepaid?: number; emisLeft?: number }
): Promise<Liability> =>
  apiRequest<Liability>(`/api/liabilities/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteLiability = (id: string): Promise<void> =>
  apiRequest<void>(`/api/liabilities/${id}`, { method: 'DELETE' });

export const deleteAccount = (id: string): Promise<void> =>
  apiRequest<void>(`/api/accounts/${id}`, { method: 'DELETE' });

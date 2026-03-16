'use client';

import React, {
  createContext, PropsWithChildren, useContext,
  useEffect, useMemo, useReducer,
} from 'react';
import { useSession } from 'next-auth/react';
import type {
  Account as AccountType, Transaction as TransactionType,
  Asset as AssetType, Liability as LiabilityType, BudgetCategory,
} from '@/lib/financeData';

export type AccountTypeName = 'Bank' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Wallet';
export type Account = AccountType & { creditLimit?: number };
export type Transaction = TransactionType;
export type Asset = AssetType;
export type Liability = LiabilityType;

// ── API helper ─────────────────────────────────────────────────────────────

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Request failed');
  }
  return res.json();
}

// ── State ──────────────────────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
  budgets: BudgetCategory[];
  loadState: LoadState;
};

type FinanceAction =
  | { type: 'hydrate'; payload: Omit<FinanceState, 'loadState'> }
  | { type: 'setLoadState'; payload: LoadState }
  | { type: 'reset' }
  | { type: 'addAccount'; payload: Account }
  | { type: 'updateAccount'; payload: Account }
  | { type: 'deleteAccount'; payload: string }
  | { type: 'addTransaction'; payload: Transaction }
  | { type: 'updateTransaction'; payload: Transaction }
  | { type: 'deleteTransaction'; payload: string }
  | { type: 'addAsset'; payload: Asset }
  | { type: 'updateAsset'; payload: Asset }
  | { type: 'deleteAsset'; payload: string }
  | { type: 'addLiability'; payload: Liability }
  | { type: 'updateLiability'; payload: Liability }
  | { type: 'deleteLiability'; payload: string }
  | { type: 'addBudget'; payload: BudgetCategory }
  | { type: 'updateBudget'; payload: BudgetCategory }
  | { type: 'deleteBudget'; payload: string };

const defaultState: FinanceState = {
  accounts: [], transactions: [], assets: [],
  liabilities: [], budgets: [], loadState: 'idle',
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'hydrate':      return { ...state, ...action.payload, loadState: 'ready' };
    case 'setLoadState': return { ...state, loadState: action.payload };
    case 'reset':        return { ...defaultState };

    case 'addAccount':    return { ...state, accounts: [...state.accounts, action.payload] };
    case 'updateAccount': return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'deleteAccount': return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };

    case 'addTransaction':    return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'updateTransaction': return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'deleteTransaction': return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };

    case 'addAsset':    return { ...state, assets: [...state.assets, action.payload] };
    case 'updateAsset': return { ...state, assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'deleteAsset': return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };

    case 'addLiability':    return { ...state, liabilities: [...state.liabilities, action.payload] };
    case 'updateLiability': return { ...state, liabilities: state.liabilities.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'deleteLiability': return { ...state, liabilities: state.liabilities.filter(l => l.id !== action.payload) };

    case 'addBudget':    return { ...state, budgets: [...state.budgets, action.payload] };
    case 'updateBudget': return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'deleteBudget': return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };

    default: return state;
  }
}

// ── Context type ───────────────────────────────────────────────────────────

type FinanceContextValue = {
  state: FinanceState;
  addAccount:             (a: Omit<Account, 'id'>)        => Promise<void>;
  updateAccount:          (a: Account)                     => Promise<void>;
  deleteAccount:          (id: string)                     => Promise<void>;
  addTransaction:         (t: Omit<Transaction, 'id'>)     => Promise<void>;
  updateTransaction:      (t: Transaction)                  => Promise<void>;
  deleteTransaction:      (id: string)                     => Promise<void>;
  addAsset:               (a: Omit<Asset, 'id'>)           => Promise<void>;
  updateAsset:            (a: Asset)                       => Promise<void>;
  deleteAsset:            (id: string)                     => Promise<void>;
  addLiability:           (l: Omit<Liability, 'id'>)       => Promise<void>;
  updateLiability:        (l: Liability)                   => Promise<void>;
  deleteLiability:        (id: string)                     => Promise<void>;
  recordLiabilityPayment: (id: string, amount: number)     => Promise<void>;
  addBudget:              (b: Omit<BudgetCategory, 'id'>)  => Promise<void>;
  updateBudget:           (b: BudgetCategory)              => Promise<void>;
  deleteBudget:           (id: string)                     => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(financeReducer, defaultState);
  const { status } = useSession();

  // Clear state when user logs out so stale data never bleeds into next session
  useEffect(() => {
    if (status === 'unauthenticated') {
      dispatch({ type: 'reset' });
    }
  }, [status]);

  // Only load data once the session is authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;

    dispatch({ type: 'setLoadState', payload: 'loading' });
    Promise.all([
      api<Account[]>('/api/accounts'),
      api<Transaction[]>('/api/transactions'),
      api<Asset[]>('/api/assets'),
      api<Liability[]>('/api/liabilities'),
      api<BudgetCategory[]>('/api/budgets'),
    ]).then(([accounts, transactions, assets, liabilities, budgets]) => {
      dispatch({ type: 'hydrate', payload: { accounts, transactions, assets, liabilities, budgets } });
    }).catch((err) => {
      console.error('Failed to load finance data:', err);
      dispatch({ type: 'setLoadState', payload: 'error' });
    });
  }, [status]);

  const value = useMemo<FinanceContextValue>(() => ({
    state,

    addAccount: async (a) => {
      const created = await api<Account>('/api/accounts', { method: 'POST', body: JSON.stringify(a) });
      dispatch({ type: 'addAccount', payload: created });
    },
    updateAccount: async (a) => {
      const updated = await api<Account>(`/api/accounts/${a.id}`, { method: 'PATCH', body: JSON.stringify(a) });
      dispatch({ type: 'updateAccount', payload: updated });
    },
    deleteAccount: async (id) => {
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteAccount', payload: id });
    },

    addTransaction: async (t) => {
      const created = await api<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(t) });
      dispatch({ type: 'addTransaction', payload: created });
      // Automatically update the linked account balance
      if (created.accountId) {
        const account = state.accounts.find(a => a.id === created.accountId);
        if (account) {
          const delta = created.type === 'income'
            ? Math.abs(created.amount)
            : -Math.abs(created.amount);
          const updated = await api<Account>(`/api/accounts/${account.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ balance: account.balance + delta }),
          });
          dispatch({ type: 'updateAccount', payload: updated });
        }
      }
    },
    updateTransaction: async (t) => {
      const updated = await api<Transaction>(`/api/transactions/${t.id}`, { method: 'PATCH', body: JSON.stringify(t) });
      dispatch({ type: 'updateTransaction', payload: updated });
    },
    deleteTransaction: async (id) => {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteTransaction', payload: id });
    },

    addAsset: async (a) => {
      const created = await api<Asset>('/api/assets', { method: 'POST', body: JSON.stringify(a) });
      dispatch({ type: 'addAsset', payload: created });
    },
    updateAsset: async (a) => {
      const updated = await api<Asset>(`/api/assets/${a.id}`, { method: 'PATCH', body: JSON.stringify(a) });
      dispatch({ type: 'updateAsset', payload: updated });
    },
    deleteAsset: async (id) => {
      await api(`/api/assets/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteAsset', payload: id });
    },

    addLiability: async (l) => {
      const created = await api<Liability>('/api/liabilities', { method: 'POST', body: JSON.stringify(l) });
      dispatch({ type: 'addLiability', payload: created });
    },
    updateLiability: async (l) => {
      const updated = await api<Liability>(`/api/liabilities/${l.id}`, { method: 'PATCH', body: JSON.stringify(l) });
      dispatch({ type: 'updateLiability', payload: updated });
    },
    deleteLiability: async (id) => {
      await api(`/api/liabilities/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteLiability', payload: id });
    },
    recordLiabilityPayment: async (id, amount) => {
      const liability = state.liabilities.find(l => l.id === id);
      if (!liability) return;
      const updated = await api<Liability>(`/api/liabilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          outstanding: Math.max(0, liability.outstanding - amount),
          totalRepaid: liability.totalRepaid + amount,
          emisLeft: Math.max(0, liability.emisLeft - 1),
        }),
      });
      dispatch({ type: 'updateLiability', payload: updated });
    },

    addBudget: async (b) => {
      const created = await api<BudgetCategory>('/api/budgets', { method: 'POST', body: JSON.stringify(b) });
      dispatch({ type: 'addBudget', payload: created });
    },
    updateBudget: async (b) => {
      const updated = await api<BudgetCategory>(`/api/budgets/${b.id}`, { method: 'PATCH', body: JSON.stringify(b) });
      dispatch({ type: 'updateBudget', payload: updated });
    },
    deleteBudget: async (id) => {
      await api(`/api/budgets/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteBudget', payload: id });
    },
  }), [state]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

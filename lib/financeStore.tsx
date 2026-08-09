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

// ── Serialization helpers ──────────────────────────────────────────────────

/** Convert an asset payload to API-safe form:
 *  - sipConfig SipConfig object → JSON string
 *  - sipConfig null/undefined   → key omitted (z.string().optional() rejects null)
 */
function serializeAsset(a: Record<string, any>) {
  const { sipConfig, ...rest } = a;
  const out: Record<string, any> = { ...rest };
  if (sipConfig != null) {
    out.sipConfig = typeof sipConfig === 'string' ? sipConfig : JSON.stringify(sipConfig);
  }
  // null / undefined → key omitted entirely
  return out;
}

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
  refreshData:            () => Promise<void>;
  addAccount:             (a: Omit<Account, 'id'>)        => Promise<void>;
  updateAccount:          (a: Account)                     => Promise<void>;
  deleteAccount:          (id: string)                     => Promise<void>;
  fixAccountBalance:      (id: string)                     => Promise<void>;
  addTransaction:         (t: Omit<Transaction, 'id'>)     => Promise<void>;
  updateTransaction:      (t: Transaction)                  => Promise<void>;
  deleteTransaction:      (id: string)                     => Promise<void>;
  addAsset:               (a: Omit<Asset, 'id'>)           => Promise<void>;
  updateAsset:            (a: Asset)                       => Promise<void>;
  deleteAsset:            (id: string)                     => Promise<void>;
  refreshAssetPrices:     () => Promise<{ updated: number; failed?: string[]; usdInr?: number }>;
  addLiability:           (l: Omit<Liability, 'id'>)       => Promise<void>;
  updateLiability:        (l: Liability)                   => Promise<void>;
  deleteLiability:        (id: string)                     => Promise<void>;
  recordLiabilityPayment: (id: string, amount: number, repaymentAccountId?: string) => Promise<void>;
  addBudget:              (b: Omit<BudgetCategory, 'id'>)  => Promise<void>;
  updateBudget:           (b: BudgetCategory)              => Promise<void>;
  deleteBudget:           (id: string)                     => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(financeReducer, defaultState);
  const { status } = useSession();

  // Reset state on logout so stale data never bleeds into next session
  useEffect(() => {
    if (status === 'unauthenticated') dispatch({ type: 'reset' });
  }, [status]);

  // Re-fetch balance-sensitive data whenever the tab becomes visible again
  // (handles changes made from another device / tab while this one was in background)
  useEffect(() => {
    if (status !== 'authenticated') return;
    async function handleVisibility() {
      if (document.hidden) return;
      try {
        const [accs, assts, liabs] = await Promise.all([
          api<Account[]>('/api/accounts'),
          api<Asset[]>('/api/assets'),
          api<Liability[]>('/api/liabilities'),
        ]);
        accs.forEach(a  => dispatch({ type: 'updateAccount',   payload: a }));
        assts.forEach(a => dispatch({ type: 'updateAsset',     payload: a }));
        liabs.forEach(l => dispatch({ type: 'updateLiability', payload: l }));
      } catch { /* silent — non-critical background refresh */ }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [status]);

  // Pick up transactions added via AiTransactionButton (which bypasses the store)
  useEffect(() => {
    const handler = (e: Event) => {
      const tx = (e as CustomEvent).detail;
      if (tx?.id) dispatch({ type: 'addTransaction', payload: tx });
    };
    window.addEventListener('orbit:transaction-added', handler);
    return () => window.removeEventListener('orbit:transaction-added', handler);
  }, []);

  // Only load data once the session is authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;

    dispatch({ type: 'setLoadState', payload: 'loading' });
    // allSettled: a single API failure doesn't wipe the other slices of data
    Promise.allSettled([
      api<Account[]>('/api/accounts'),
      api<Transaction[]>('/api/transactions'),
      api<Asset[]>('/api/assets'),
      api<Liability[]>('/api/liabilities'),
      api<BudgetCategory[]>('/api/budgets'),
    ]).then(([accountsRes, transactionsRes, assetsRes, liabilitiesRes, budgetsRes]) => {
      dispatch({
        type: 'hydrate',
        payload: {
          accounts:     accountsRes.status     === 'fulfilled' ? accountsRes.value     : [],
          transactions: transactionsRes.status === 'fulfilled' ? transactionsRes.value : [],
          assets:       assetsRes.status       === 'fulfilled' ? assetsRes.value       : [],
          liabilities:  liabilitiesRes.status  === 'fulfilled' ? liabilitiesRes.value  : [],
          budgets:      budgetsRes.status      === 'fulfilled' ? budgetsRes.value      : [],
        },
      });
    });
  }, [status]);

  const value = useMemo<FinanceContextValue>(() => ({
    state,

    refreshData: async () => {
      try {
        const [accs, assts, liabs] = await Promise.all([
          api<Account[]>('/api/accounts'),
          api<Asset[]>('/api/assets'),
          api<Liability[]>('/api/liabilities'),
        ]);
        accs.forEach(a  => dispatch({ type: 'updateAccount',   payload: a }));
        assts.forEach(a => dispatch({ type: 'updateAsset',     payload: a }));
        liabs.forEach(l => dispatch({ type: 'updateLiability', payload: l }));
      } catch { /* silent */ }
    },

    addAccount: async (a) => {
      const created = await api<Account>('/api/accounts', { method: 'POST', body: JSON.stringify(a) });
      dispatch({ type: 'addAccount', payload: created });
      // Record Opening Balance transaction when account has a non-zero starting balance.
      // We call the API directly (not the store's addTransaction) to avoid double-updating
      // the balance — the account was already created with the correct balance.
      if (created.balance !== 0) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const res = await api<{ transaction: Transaction }>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
              date: today,
              category: 'Opening Balance',
              description: 'Opening Balance',
              amount: created.balance,
              type: 'opening_balance',
              accountId: created.id,
            }),
          });
          dispatch({ type: 'addTransaction', payload: res.transaction });
        } catch { /* non-critical */ }
      }
    },
    updateAccount: async (a) => {
      const existing = state.accounts.find(acc => acc.id === a.id);
      const updated = await api<Account>(`/api/accounts/${a.id}`, { method: 'PATCH', body: JSON.stringify(a) });
      dispatch({ type: 'updateAccount', payload: updated });
      // Record Balance Adjustment when the balance actually changed.
      // Direct API call (not store's addTransaction) to skip the balance side-effect —
      // the account already has the new balance after the PATCH above.
      if (existing && updated.balance !== existing.balance) {
        try {
          const diff = updated.balance - existing.balance;
          const today = new Date().toISOString().slice(0, 10);
          const res = await api<{ transaction: Transaction }>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
              date: today,
              category: 'Balance Adjustment',
              description: 'Balance Adjustment',
              amount: diff,
              type: 'adjustment',
              accountId: a.id,
            }),
          });
          dispatch({ type: 'addTransaction', payload: res.transaction });
        } catch { /* non-critical */ }
      }
    },
    deleteAccount: async (id) => {
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteAccount', payload: id });
    },
    fixAccountBalance: async (id) => {
      const today = new Date().toLocaleDateString('en-CA');
      const txNet = state.transactions
        .filter(t => t.accountId === id && t.date <= today)
        .reduce((s, t) => s + t.amount, 0);
      const updated = await api<Account>(`/api/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ balance: txNet }),
      });
      dispatch({ type: 'updateAccount', payload: updated });
    },

    addTransaction: async (t) => {
      const res = await api<{ transaction: Transaction; updatedAsset?: Asset; updatedLiability?: Liability }>(
        '/api/transactions', { method: 'POST', body: JSON.stringify(t) }
      );
      dispatch({ type: 'addTransaction', payload: res.transaction });
      if (res.updatedAsset)     dispatch({ type: 'updateAsset',     payload: res.updatedAsset });
      if (res.updatedLiability) dispatch({ type: 'updateLiability', payload: res.updatedLiability });
      try {
        const accounts = await api<Account[]>('/api/accounts');
        accounts.forEach(account => dispatch({ type: 'updateAccount', payload: account }));
      } catch { /* non-critical */ }
      try {
        const budgets = await api<BudgetCategory[]>('/api/budgets');
        budgets.forEach(budget => dispatch({ type: 'updateBudget', payload: budget }));
      } catch { /* non-critical */ }
    },
    updateTransaction: async (t) => {
      const updated = await api<Transaction>(`/api/transactions/${t.id}`, { method: 'PATCH', body: JSON.stringify(t) });
      dispatch({ type: 'updateTransaction', payload: updated });
      try {
        const accounts = await api<Account[]>('/api/accounts');
        accounts.forEach(account => dispatch({ type: 'updateAccount', payload: account }));
      } catch { /* non-critical */ }
      try {
        const budgets = await api<BudgetCategory[]>('/api/budgets');
        budgets.forEach(budget => dispatch({ type: 'updateBudget', payload: budget }));
      } catch { /* non-critical */ }
    },
    deleteTransaction: async (id) => {
      const res = await api<{ ok: boolean; updatedAsset?: Asset; updatedLiability?: Liability }>(
        `/api/transactions/${id}`, { method: 'DELETE' }
      );
      dispatch({ type: 'deleteTransaction', payload: id });
      if (res.updatedAsset)     dispatch({ type: 'updateAsset',     payload: res.updatedAsset });
      if (res.updatedLiability) dispatch({ type: 'updateLiability', payload: res.updatedLiability });
      try {
        const accounts = await api<Account[]>('/api/accounts');
        accounts.forEach(account => dispatch({ type: 'updateAccount', payload: account }));
      } catch { /* non-critical */ }
      try {
        const budgets = await api<BudgetCategory[]>('/api/budgets');
        budgets.forEach(budget => dispatch({ type: 'updateBudget', payload: budget }));
      } catch { /* non-critical */ }
    },

    addAsset: async (a) => {
      const payload = serializeAsset(a as unknown as Record<string, unknown>);
      const created = await api<{ asset: Asset; fundingTransaction?: Transaction | null; updatedAccount?: Account | null; sipTransactions?: Transaction[]; sipUpdatedAccount?: Account | null }>('/api/assets', { method: 'POST', body: JSON.stringify(payload) });
      dispatch({ type: 'addAsset', payload: created.asset });
      if (created.fundingTransaction) dispatch({ type: 'addTransaction', payload: created.fundingTransaction });
      if (created.updatedAccount) dispatch({ type: 'updateAccount', payload: created.updatedAccount });
      if (created.sipTransactions?.length) created.sipTransactions.forEach(t => dispatch({ type: 'addTransaction', payload: t }));
      if (created.sipUpdatedAccount) dispatch({ type: 'updateAccount', payload: created.sipUpdatedAccount });
    },
    updateAsset: async (a) => {
      const payload = serializeAsset(a as unknown as Record<string, unknown>);
      const updated = await api<Asset & { sipTransactions?: Transaction[]; sipUpdatedAccount?: Account | null }>(`/api/assets/${a.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      dispatch({ type: 'updateAsset', payload: updated });
      if (updated.sipTransactions?.length) updated.sipTransactions.forEach(t => dispatch({ type: 'addTransaction', payload: t }));
      if (updated.sipUpdatedAccount) dispatch({ type: 'updateAccount', payload: updated.sipUpdatedAccount });
    },
    deleteAsset: async (id) => {
      await api(`/api/assets/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteAsset', payload: id });
    },
    refreshAssetPrices: async () => {
      const result = await api<{ updated: number; failed?: string[]; usdInr?: number; assets?: Asset[] }>(
        '/api/assets/refresh-prices', { method: 'POST' },
      );
      if (result.assets) {
        result.assets.forEach(asset => dispatch({ type: 'updateAsset', payload: asset }));
      }
      return { updated: result.updated, failed: result.failed, usdInr: result.usdInr };
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
    recordLiabilityPayment: async (id, amount, repaymentAccountId) => {
      const liability = state.liabilities.find(l => l.id === id);
      if (!liability) return;

      // Reducing-balance: split payment into interest + principal
      let principalPaid = amount;
      if (liability.interestRate && liability.interestRate > 0) {
        const monthlyRate = liability.interestRate / 100 / 12;
        const interestDue = liability.outstanding * monthlyRate;
        principalPaid = Math.max(0, amount - interestDue);
      }

      // Advance next due date by 1 month
      let nextDueDate = liability.nextDueDate;
      if (nextDueDate) {
        const d = new Date(nextDueDate);
        d.setMonth(d.getMonth() + 1);
        nextDueDate = d.toISOString().slice(0, 10);
      }

      const updated = await api<Liability>(`/api/liabilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          outstanding: Math.max(0, liability.outstanding - principalPaid),
          totalRepaid: liability.totalRepaid + amount,
          emisLeft: Math.max(0, liability.emisLeft - 1),
          nextDueDate,
        }),
      });
      dispatch({ type: 'updateLiability', payload: updated });

      // Debit the repayment account: create an expense transaction + update account balance
      const accId = repaymentAccountId ?? liability.repaymentAccountId;
      if (accId) {
        const account = state.accounts.find(a => a.id === accId);
        const today = new Date().toISOString().slice(0, 10);
        try {
          const res = await api<{ transaction: Transaction }>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
              date: today,
              category: 'Loan',
              description: liability.name + ' EMI',
              amount: -Math.abs(amount),
              type: 'expense',
              accountId: accId,
            }),
          });
          dispatch({ type: 'addTransaction', payload: res.transaction });
          // Update account balance
          if (account) {
            const updatedAcc = await api<Account>(`/api/accounts/${accId}`, {
              method: 'PATCH',
              body: JSON.stringify({ balance: account.balance - Math.abs(amount) }),
            });
            dispatch({ type: 'updateAccount', payload: updatedAcc });
          }
        } catch { /* non-critical — liability payment still recorded */ }
      }
    },

    addBudget: async (b) => {
      const created = await api<BudgetCategory>('/api/budgets', { method: 'POST', body: JSON.stringify(b) });
      dispatch({ type: 'addBudget', payload: created });
    },
    updateBudget: async (b) => {
      // Recalculate spent from current-month transactions after category update
      const nowDate = new Date();
      const cats = b.category
        ? b.category.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const recalcSpent = state.transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type === 'expense'
            && d.getMonth() === nowDate.getMonth()
            && d.getFullYear() === nowDate.getFullYear()
            && (cats.includes(t.category) || b.name === t.category);
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const payload = { ...b, spent: recalcSpent };
      const updated = await api<BudgetCategory>(`/api/budgets/${b.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
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
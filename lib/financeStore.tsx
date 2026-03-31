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
  addAccount:               (a: Omit<Account, 'id'>)        => Promise<void>;
  updateAccount:            (a: Account)                     => Promise<void>;
  deleteAccount:            (id: string)                     => Promise<void>;
  reconcileOpeningBalance:  (accountId: string)              => Promise<void>;
  addTransaction:         (t: Omit<Transaction, 'id'>)     => Promise<void>;
  updateTransaction:      (t: Transaction)                  => Promise<void>;
  deleteTransaction:      (id: string)                     => Promise<void>;
  addAsset:               (a: Omit<Asset, 'id'>)           => Promise<void>;
  updateAsset:            (a: Asset)                       => Promise<void>;
  deleteAsset:            (id: string)                     => Promise<void>;
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

    // Run one-time migration to update legacy category-based types to proper types.
    // Fire-and-forget — load proceeds regardless of migration outcome.
    fetch('/api/migrate-transactions', { method: 'POST' }).catch(() => {});

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
      // Record Opening Balance transaction when account has a non-zero starting balance.
      // We call the API directly (not the store's addTransaction) to avoid double-updating
      // the balance — the account was already created with the correct balance.
      if (created.balance !== 0) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const tx = await api<Transaction>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
              date: today,
              category: 'Opening Balance',
              description: 'Opening Balance',
              amount: Math.abs(created.balance),
              type: 'opening_balance',
              accountId: created.id,
            }),
          });
          dispatch({ type: 'addTransaction', payload: tx });
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
          const tx = await api<Transaction>('/api/transactions', {
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
          dispatch({ type: 'addTransaction', payload: tx });
        } catch { /* non-critical */ }
      }
    },
    deleteAccount: async (id) => {
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
      dispatch({ type: 'deleteAccount', payload: id });
    },
    reconcileOpeningBalance: async (accountId) => {
      const account = state.accounts.find(a => a.id === accountId);
      if (!account) return;
      const txNetBalance = state.transactions
        .filter(t => t.accountId === accountId)
        .reduce((s, t) => {
          if (t.type === 'income') return s + Math.abs(t.amount);
          if (t.type === 'expense') return s - Math.abs(t.amount);
          if (t.type === 'transfer') return s + t.amount; // negative for source, positive for destination
          if (t.type === 'opening_balance') return s + t.amount; // always positive
          if (t.type === 'adjustment') return s + t.amount; // positive or negative diff
          return s;
        }, 0);
      const diff = account.balance - txNetBalance;
      if (Math.abs(diff) < 1) return;
      const txRow = await api<Transaction>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          date: new Date().toISOString().slice(0, 10),
          category: 'Opening Balance',
          description: 'Opening balance',
          amount: Math.abs(diff),
          type: 'opening_balance',
        }),
      });
      dispatch({ type: 'addTransaction', payload: txRow });
      // Intentionally NOT patching account.balance — it is already correct
    },


    addTransaction: async (t) => {
      const created = await api<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(t) });
      dispatch({ type: 'addTransaction', payload: created });
      // Update linked account balance only if transaction date is today or in the past
      // Future-dated recurring transactions appear in the list but don't affect balance yet
      const today = new Date().toISOString().slice(0, 10);
      if (created.date <= today) {
        // income / expense / transfer: update the linked account by the transaction amount
        // (transfer uses signed amount: negative for source side, positive for destination side)
        // opening_balance / adjustment: caller manages account balance directly — skip here
        if (t.accountId && (t.type === 'income' || t.type === 'expense' || t.type === 'transfer')) {
          const account = state.accounts.find(a => a.id === t.accountId);
          if (account) {
            try {
              const updated = await api<Account>(`/api/accounts/${account.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ balance: account.balance + created.amount }),
              });
              dispatch({ type: 'updateAccount', payload: updated });
            } catch { /* non-critical */ }
          }
        }

        // Recalculate spent for ALL budgets from scratch using current-month expense transactions
        const txDate = new Date(created.date);
        const nowDate = new Date();
        const isCurrentMonth = txDate.getMonth() === nowDate.getMonth() && txDate.getFullYear() === nowDate.getFullYear();
        if (created.type === 'expense' && isCurrentMonth) {
          const allTx = [...state.transactions, created];
          const monthTx = allTx.filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense'
              && d.getMonth() === nowDate.getMonth()
              && d.getFullYear() === nowDate.getFullYear();
          });
          for (const budget of state.budgets) {
            const cats = budget.category
              ? budget.category.split(',').map(c => c.trim()).filter(Boolean)
              : [];
            const recalcSpent = monthTx
              .filter(t => cats.includes(t.category) || budget.name === t.category)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            if (recalcSpent !== budget.spent) {
              try {
                const updatedBudget = await api<BudgetCategory>(`/api/budgets/${budget.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ spent: recalcSpent }),
                });
                dispatch({ type: 'updateBudget', payload: updatedBudget });
              } catch { /* non-critical */ }
            }
          }
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
      const payload = serializeAsset(a as unknown as Record<string, any>);
      const created = await api<Asset>('/api/assets', { method: 'POST', body: JSON.stringify(payload) });
      dispatch({ type: 'addAsset', payload: created });
      // When an account is linked, record the investment as an expense transaction and
      // deduct the invested amount from the account balance.
      // Direct API call (not store's addTransaction) to control balance update ourselves.
      if (created.accountId) {
        const account = state.accounts.find(acc => acc.id === created.accountId);
        if (account) {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const tx = await api<Transaction>('/api/transactions', {
              method: 'POST',
              body: JSON.stringify({
                date: today,
                category: 'Investment',
                description: created.name,
                amount: -Math.abs(created.invested),
                type: 'expense',
                accountId: created.accountId,
              }),
            });
            dispatch({ type: 'addTransaction', payload: tx });
            // Deduct invested amount from the linked account
            const updatedAcc = await api<Account>(`/api/accounts/${account.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ balance: account.balance - Math.abs(created.invested) }),
            });
            dispatch({ type: 'updateAccount', payload: updatedAcc });
          } catch { /* non-critical — asset still saved */ }
        }
      }
    },
    updateAsset: async (a) => {
      const payload = serializeAsset(a as unknown as Record<string, any>);
      const updated = await api<Asset>(`/api/assets/${a.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
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
    recordLiabilityPayment: async (id, amount, repaymentAccountId) => {
      const liability = state.liabilities.find(l => l.id === id);
      if (!liability) return;

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
          outstanding: Math.max(0, liability.outstanding - amount),
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
          const tx = await api<Transaction>('/api/transactions', {
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
          dispatch({ type: 'addTransaction', payload: tx });
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
            && t.category !== 'Opening Balance'
            && t.category !== 'Balance Adjustment'
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
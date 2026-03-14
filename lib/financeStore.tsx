'use client';

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  Account as AccountType,
  Transaction as TransactionType,
  Asset as AssetType,
  Liability as LiabilityType,
  BudgetCategory,
  accounts as initialAccounts,
  transactions as initialTransactions,
  assets as initialAssets,
  liabilities as initialLiabilities,
  budgets as initialBudgets,
} from '@/lib/financeData';

export type AccountTypeName = 'Bank' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Wallet';

export type Account = AccountType & { creditLimit?: number };
export type Transaction = TransactionType;
export type Asset = AssetType;
export type Liability = LiabilityType;

type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
  budgets: BudgetCategory[];
};

type FinanceAction =
  | { type: 'addAccount';       payload: Account }
  | { type: 'deleteAccount';    payload: string }
  | { type: 'addTransaction';   payload: Transaction }
  | { type: 'deleteTransaction'; payload: string }
  | { type: 'addAsset';         payload: Asset }
  | { type: 'deleteAsset';      payload: string }
  | { type: 'addLiability';        payload: Liability }
  | { type: 'updateLiability';      payload: Liability }
  | { type: 'recordLiabilityPayment'; payload: { id: string; amount: number } }
  | { type: 'deleteLiability';        payload: string }
  | { type: 'addBudget';        payload: BudgetCategory }
  | { type: 'deleteBudget';     payload: string }
  | { type: 'hydrate';          payload: FinanceState };

const STORAGE_KEY = 'myorbit_finance_v1';

function loadFromStorage(): FinanceState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinanceState;
  } catch {
    return null;
  }
}

function saveToStorage(state: FinanceState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private mode — fail silently
  }
}

const defaultState: FinanceState = {
  accounts:     initialAccounts,
  transactions: initialTransactions,
  assets:       initialAssets,
  liabilities:  initialLiabilities,
  budgets:      initialBudgets,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;

    case 'addAccount':
      return { ...state, accounts: [...state.accounts, action.payload] };

    case 'deleteAccount':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };

    case 'addTransaction': {
      const tx = action.payload;
      // Update linked account balance
      const accounts = state.accounts.map(a => {
        if (a.id !== tx.accountId) return a;
        return { ...a, balance: a.balance + tx.amount };
      });
      // Update matching budget spent when expense is added
      const budgets = tx.type === 'expense'
        ? state.budgets.map(b =>
            b.name === tx.category
              ? { ...b, spent: b.spent + Math.abs(tx.amount) }
              : b
          )
        : state.budgets;
      return { ...state, accounts, budgets, transactions: [tx, ...state.transactions] };
    }

    case 'deleteTransaction': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      // Reverse the account balance effect
      const accounts = state.accounts.map(a => {
        if (a.id !== tx.accountId) return a;
        return { ...a, balance: a.balance - tx.amount };
      });
      // Reverse the budget spent effect
      const budgets = tx.type === 'expense'
        ? state.budgets.map(b =>
            b.name === tx.category
              ? { ...b, spent: Math.max(0, b.spent - Math.abs(tx.amount)) }
              : b
          )
        : state.budgets;
      return {
        ...state,
        accounts,
        budgets,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    }

    case 'addAsset':
      return { ...state, assets: [...state.assets, action.payload] };

    case 'deleteAsset':
      return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };

    case 'addLiability':
      return { ...state, liabilities: [...state.liabilities, action.payload] };

    case 'updateLiability':
      return { ...state, liabilities: state.liabilities.map(l => l.id === action.payload.id ? action.payload : l) };

    case 'recordLiabilityPayment': {
      const { id, amount } = action.payload;
      return {
        ...state,
        liabilities: state.liabilities.map(l => {
          if (l.id !== id) return l;
          const newOutstanding = Math.max(0, l.outstanding - amount);
          const newRepaid      = l.totalRepaid + amount;
          const newEmisLeft    = Math.max(0, l.emisLeft - 1);
          return { ...l, outstanding: newOutstanding, totalRepaid: newRepaid, emisLeft: newEmisLeft };
        }),
      };
    }

    case 'deleteLiability':
      return { ...state, liabilities: state.liabilities.filter(l => l.id !== action.payload) };

    case 'addBudget':
      return { ...state, budgets: [...state.budgets, action.payload] };

    case 'deleteBudget':
      return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };

    default:
      return state;
  }
}

type FinanceContextValue = {
  state: FinanceState;
  addAccount:       (account:     Omit<Account,      'id'>) => void;
  deleteAccount:    (id: string)                            => void;
  addTransaction:   (transaction: Omit<Transaction,  'id'>) => void;
  deleteTransaction:(id: string)                            => void;
  addAsset:         (asset:       Omit<Asset,        'id'>) => void;
  deleteAsset:      (id: string)                            => void;
  addLiability:          (liability: Omit<Liability, 'id'>) => void;
  updateLiability:       (liability: Liability)              => void;
  recordLiabilityPayment:(id: string, amount: number)        => void;
  deleteLiability:       (id: string)                        => void;
  addBudget:        (budget:      Omit<BudgetCategory,'id'>) => void;
  deleteBudget:     (id: string)                            => void;
  clearData:        ()                                      => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function generateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(financeReducer, defaultState);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) dispatch({ type: 'hydrate', payload: saved });
  }, []);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const value = useMemo(() => ({
    state,
    addAccount:       (a: Omit<Account,       'id'>) => dispatch({ type: 'addAccount',       payload: { ...a, id: generateId() } }),
    deleteAccount:    (id: string)                   => dispatch({ type: 'deleteAccount',    payload: id }),
    addTransaction:   (t: Omit<Transaction,   'id'>) => dispatch({ type: 'addTransaction',   payload: { ...t, id: generateId() } }),
    deleteTransaction:(id: string)                   => dispatch({ type: 'deleteTransaction',payload: id }),
    addAsset:         (a: Omit<Asset,         'id'>) => dispatch({ type: 'addAsset',         payload: { ...a, id: generateId() } }),
    deleteAsset:      (id: string)                   => dispatch({ type: 'deleteAsset',      payload: id }),
    addLiability:          (l: Omit<Liability, 'id'>) => dispatch({ type: 'addLiability',          payload: { ...l, id: generateId() } }),
    updateLiability:       (l: Liability)              => dispatch({ type: 'updateLiability',       payload: l }),
    recordLiabilityPayment:(id: string, amount: number)=> dispatch({ type: 'recordLiabilityPayment', payload: { id, amount } }),
    deleteLiability:       (id: string)                => dispatch({ type: 'deleteLiability',        payload: id }),
    addBudget:        (b: Omit<BudgetCategory,'id'>) => dispatch({ type: 'addBudget',        payload: { ...b, id: generateId() } }),
    deleteBudget:     (id: string)                   => dispatch({ type: 'deleteBudget',     payload: id }),
    clearData: () => {
      if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: 'hydrate', payload: defaultState });
    },
  }), [state]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
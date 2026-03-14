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

export type Account = AccountType;
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
  | { type: 'addAccount'; payload: Account }
  | { type: 'addTransaction'; payload: Transaction }
  | { type: 'addAsset'; payload: Asset }
  | { type: 'addLiability'; payload: Liability }
  | { type: 'hydrate'; payload: FinanceState };

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
    // storage quota exceeded or private mode — fail silently
  }
}

const defaultState: FinanceState = {
  accounts: initialAccounts,
  transactions: initialTransactions,
  assets: initialAssets,
  liabilities: initialLiabilities,
  budgets: initialBudgets,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'addAccount':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'addTransaction': {
      const newState = { ...state, transactions: [action.payload, ...state.transactions] };
      const cat = action.payload.category;
      if (action.payload.type === 'expense') {
        newState.budgets = state.budgets.map((b) =>
          b.name === cat
            ? { ...b, spent: b.spent + Math.abs(action.payload.amount) }
            : b
        );
      }
      return newState;
    }
    case 'addAsset':
      return { ...state, assets: [...state.assets, action.payload] };
    case 'addLiability':
      return { ...state, liabilities: [...state.liabilities, action.payload] };
    default:
      return state;
  }
}

type FinanceContextValue = {
  state: FinanceState;
  addAccount: (account: Omit<Account, 'id'>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  clearData: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function generateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(financeReducer, defaultState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      dispatch({ type: 'hydrate', payload: saved });
    }
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addAccount = (account: Omit<Account, 'id'>) => {
    dispatch({ type: 'addAccount', payload: { ...account, id: generateId() } });
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    dispatch({ type: 'addTransaction', payload: { ...transaction, id: generateId() } });
  };

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    dispatch({ type: 'addAsset', payload: { ...asset, id: generateId() } });
  };

  const addLiability = (liability: Omit<Liability, 'id'>) => {
    dispatch({ type: 'addLiability', payload: { ...liability, id: generateId() } });
  };

  const clearData = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'hydrate', payload: defaultState });
  };

  const value = useMemo(
    () => ({ state, addAccount, addTransaction, addAsset, addLiability, clearData }),
    [state]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
}

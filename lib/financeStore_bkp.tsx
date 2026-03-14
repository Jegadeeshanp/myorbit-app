'use client';

import React, { createContext, PropsWithChildren, useContext, useMemo, useReducer } from 'react';
import {
  Account as AccountType,
  Transaction as TransactionType,
  Asset as AssetType,
  Liability as LiabilityType,
  accounts as initialAccounts,
  transactions as initialTransactions,
  assets as initialAssets,
  liabilities as initialLiabilities,
} from '@/lib/financeData';

export type AccountTypeName = 'Bank' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Wallet';

export type Account = {
  id: string;
  name: string;
  type: AccountTypeName;
  balance: number;
  creditLimit?: number;
};

export type Transaction = TransactionType;
export type Asset = AssetType;
export type Liability = LiabilityType;

type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
};

type FinanceAction =
  | { type: 'addAccount'; payload: Account }
  | { type: 'addTransaction'; payload: Transaction }
  | { type: 'addAsset'; payload: Asset }
  | { type: 'addLiability'; payload: Liability };

const normalizeAccountType = (type: AccountType['type']): AccountTypeName => {
  if (type === 'Cash') return 'Cash';
  if (type === 'Credit Card') return 'Credit Card';
  return 'Bank';
};

const initialState: FinanceState = {
  accounts: initialAccounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: a.balance,
    type: normalizeAccountType(a.type),
  })),
  transactions: initialTransactions,
  assets: initialAssets,
  liabilities: initialLiabilities,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'addAccount':
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };
    case 'addTransaction':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'addAsset':
      return {
        ...state,
        assets: [...state.assets, action.payload],
      };
    case 'addLiability':
      return {
        ...state,
        liabilities: [...state.liabilities, action.payload],
      };
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
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  const addAccount = (account: Omit<Account, 'id'>) => {
    dispatch({
      type: 'addAccount',
      payload: {
        ...account,
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      },
    });
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    dispatch({
      type: 'addTransaction',
      payload: {
        ...transaction,
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      },
    });
  };

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    dispatch({
      type: 'addAsset',
      payload: {
        ...asset,
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      },
    });
  };

  const addLiability = (liability: Omit<Liability, 'id'>) => {
    dispatch({
      type: 'addLiability',
      payload: {
        ...liability,
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      },
    });
  };

  const value = useMemo(
    () => ({ state, addAccount, addTransaction, addAsset, addLiability }),
    [state]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}

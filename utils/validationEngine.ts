import type { Account, Transaction } from '@/lib/financeData';

export type LedgerSummary = {
  credit: number;
  debit: number;
  balance: number;
  entries: number;
};

export type ValidationResult = {
  passed: boolean;
  errors: string[];
};

export function summarizeLedger(transactions: Transaction[]): LedgerSummary {
  const credit = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const debit = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  return {
    entries: transactions.length,
    credit,
    debit,
    balance: credit - debit,
  };
}

export function doubleEntryCheck(transactions: Transaction[]) {
  const signMismatch = transactions.some((tx) => {
    if (tx.type === 'income' && tx.amount <= 0) return true;
    if (tx.type === 'expense' && tx.amount >= 0) return true;
    return false;
  });
  return {
    passed: !signMismatch,
    difference: 0,
    hasSignMismatch: signMismatch,
  };
}

export function detectDuplicateTransactions(transactions: Transaction[]) {
  const tracker = new Set<string>();
  const duplicates: string[] = [];
  transactions.forEach((tx) => {
    if (tracker.has(tx.id)) {
      duplicates.push(tx.id);
      return;
    }
    tracker.add(tx.id);
  });
  return duplicates;
}

export function ensureNonCreditAccountBalances(transactions: Transaction[], accounts: Account[]) {
  return accounts.filter((account) => account.type !== 'Credit Card' && account.balance < 0);
}

export function runValidationRules(
  transactions: Transaction[],
  accounts: Account[],
  options?: { expectedBalance?: number },
): ValidationResult {
  const errors: string[] = [];
  const ledger = summarizeLedger(transactions);
  const doubleEntry = doubleEntryCheck(transactions);

  if (!doubleEntry.passed) {
    errors.push(`Debit/credit mismatch (${doubleEntry.difference.toFixed(2)})`);
    if (doubleEntry.hasSignMismatch) {
      errors.push('Transaction types do not match their amount signs');
    }
  }

  const duplicates = detectDuplicateTransactions(transactions);
  if (duplicates.length) {
    errors.push(`Duplicate transaction IDs detected: ${duplicates.join(', ')}`);
  }

  const invalidAccounts = ensureNonCreditAccountBalances(transactions, accounts);
  if (invalidAccounts.length) {
    invalidAccounts.forEach((account) =>
      errors.push(`Account ${account.name} has invalid negative balance (${account.balance})`),
    );
  }

  if (options?.expectedBalance !== undefined) {
    if (Math.abs(ledger.balance - options.expectedBalance) > 0.01) {
      errors.push(
        `Computed balance (${ledger.balance.toFixed(2)}) does not match expected (${options.expectedBalance.toFixed(2)})`,
      );
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

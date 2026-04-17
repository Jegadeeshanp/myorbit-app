'use client';

import { ChevronDown } from 'lucide-react';

export interface Account {
  id: string;
  name: string;
  type: 'Bank' | 'Credit Card' | 'Cash' | 'Debit Card' | 'Wallet';
  balance: number;
}

export interface TransactionFilterBarProps {
  accounts: Account[];
  selectedType: string;
  selectedAccountId: string;
  onTypeChange: (type: string) => void;
  onAccountChange: (accountId: string) => void;
}

const ACCOUNT_TYPES = ['All', 'Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'];

/**
 * Get plural form for account type (used in dropdown "All [Types]")
 */
function getPluralTypeName(type: string): string {
  if (type === 'Cash') return 'Cashes';
  if (type === 'Wallet') return 'Wallets';
  if (type.endsWith('Card')) return type + 's';
  return type + 's';
}

export default function TransactionFilterBar({
  accounts,
  selectedType,
  selectedAccountId,
  onTypeChange,
  onAccountChange,
}: TransactionFilterBarProps) {
  // Get unique types that have at least one account
  const availableTypes = new Set(accounts.map(a => a.type));
  const typesToShow = ACCOUNT_TYPES.filter(
    t => t === 'All' || availableTypes.has(t as any)
  );

  // Get accounts for the selected type
  const typeAccounts = selectedType === 'All'
    ? []
    : accounts.filter(a => a.type === selectedType);

  return (
    <div className="space-y-3">
      {/* Tab strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {typesToShow.map(type => {
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Dropdown — only show when selectedType !== 'All' */}
      {selectedType !== 'All' && typeAccounts.length > 0 && (
        <div className="mt-3">
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={e => onAccountChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
            >
              <option value="">All {getPluralTypeName(selectedType)}</option>
              {typeAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}

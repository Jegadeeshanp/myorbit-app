'use client';

import { ChevronDown } from 'lucide-react';
import { Account } from '@/lib/financeStore';

const ACCOUNT_TYPES = ['All', 'Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'] as const;
type AccountTypeName = typeof ACCOUNT_TYPES[number];

interface TransactionFilterBarProps {
  accounts: Account[];
  selectedType: string;       // 'All' | 'Bank' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Wallet'
  selectedAccountId: string;  // '' = all of this type
  onTypeChange: (type: string) => void;
  onAccountChange: (accountId: string) => void;
}

export default function TransactionFilterBar({
  accounts,
  selectedType,
  selectedAccountId,
  onTypeChange,
  onAccountChange,
}: TransactionFilterBarProps) {
  // Only render a type tab if ≥1 account of that type exists
  const visibleTypes = ACCOUNT_TYPES.filter(t => {
    if (t === 'All') return true;
    return accounts.some(a => a.type === t);
  });

  const accountsOfType = accounts.filter(a => a.type === selectedType);

  const handleTypeClick = (type: string) => {
    onTypeChange(type);
    // For single-account types: auto-select that account
    if (type !== 'All') {
      const ofType = accounts.filter(a => a.type === type);
      if (ofType.length === 1) {
        onAccountChange(ofType[0].id);
      } else {
        onAccountChange('');
      }
    } else {
      onAccountChange('');
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {visibleTypes.map(type => {
        const isActive = selectedType === type;
        return (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className={
              isActive
                ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900 whitespace-nowrap flex-none'
                : 'px-3 py-1.5 rounded-full text-xs font-medium border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition whitespace-nowrap flex-none'
            }
          >
            {type}
          </button>
        );
      })}

      {/* Inline account select — only when type != All AND ≥2 accounts of that type */}
      {selectedType !== 'All' && accountsOfType.length >= 2 && (
        <div className="relative flex-none">
          <select
            value={selectedAccountId}
            onChange={e => onAccountChange(e.target.value)}
            className="rounded-full border border-blue-500 bg-transparent pl-3 pr-7 py-1.5 text-xs text-blue-400 focus:outline-none cursor-pointer appearance-none whitespace-nowrap"
          >
            <option value="">All {selectedType}s</option>
            {accountsOfType.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-blue-400" />
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Modal from './Modal';
import { AccountTypeName } from '@/lib/financeStore';

const accountTypes: AccountTypeName[] = ['Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'];

export type AddAccountProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    type: AccountTypeName;
    balance: number;
    creditLimit?: number;
  }) => void;
};

export default function AddAccountModal({ open, onClose, onSave }: AddAccountProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountTypeName>('Bank');
  const [balance, setBalance] = useState('0');
  const [creditLimit, setCreditLimit] = useState('0');

  const isCredit = type === 'Credit Card';

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (isNaN(Number(balance))) return false;
    if (isCredit && isNaN(Number(creditLimit))) return false;
    return true;
  }, [name, balance, creditLimit, isCredit]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSave({
      name: name.trim(),
      type,
      balance: Number(balance),
      creditLimit: isCredit ? Number(creditLimit) : undefined,
    });

    setName('');
    setBalance('0');
    setCreditLimit('0');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add new account">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HDFC Savings"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Account type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AccountTypeName)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {accountTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Balance</label>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            type="number"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {isCredit && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Credit limit</label>
            <input
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="150000"
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save account
          </button>
        </div>
      </div>
    </Modal>
  );
}

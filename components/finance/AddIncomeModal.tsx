'use client';

import { useMemo, useState } from 'react';
import Modal from './Modal';
import { Transaction } from '@/lib/financeData';

export type AddIncomeProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  onSave: (payload: Omit<Transaction, 'id'>) => void;
};

export default function AddIncomeModal({ open, onClose, accounts, onSave }: AddIncomeProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState('Salary');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');

  const canSubmit = useMemo(() => {
    if (!date || !source.trim() || !amount || !accountId) return false;
    const num = Number(amount);
    return !isNaN(num) && num > 0;
  }, [date, source, amount, accountId]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSave({
      date,
      category: 'Income',
      description: source.trim(),
      amount: Math.abs(Number(amount)),
      type: 'income',
      accountId,
    });

    setSource('Salary');
    setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add income">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Salary"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="45000"
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {accounts.map((acct) => (
                <option key={acct.id} value={acct.id}>
                  {acct.name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            Save income
          </button>
        </div>
      </div>
    </Modal>
  );
}

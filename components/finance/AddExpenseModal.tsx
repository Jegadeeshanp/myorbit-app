'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Transaction } from '@/lib/financeData';

// Category names must match financeData budget names exactly for budget tracking
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Education', 'Travel', 'Others'];

export type AddExpenseProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  onSave: (payload: Omit<Transaction, 'id'>) => void;
};

export default function AddExpenseModal({ open, onClose, accounts, onSave }: AddExpenseProps) {
  const [date, setDate]           = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [description, setDesc]    = useState('');
  const [amount, setAmount]       = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');

  const canSubmit = useMemo(() =>
    !!date && !!category && !!description.trim() && !!amount && !!accountId && !isNaN(Number(amount)) && Number(amount) > 0,
  [date, category, description, amount, accountId]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ date, category, description: description.trim(), amount: -Math.abs(Number(amount)), type: 'expense', accountId });
    toast('Expense recorded');
    setDesc(''); setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add expense" subtitle="Record a payment or purchase">
      <div className="space-y-5">

        <div>
          <SectionLabel>Expense details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Lunch at cafe" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Amount & account</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="250" type="number" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
            Save expense
          </button>
        </div>
      </div>
    </Modal>
  );
}
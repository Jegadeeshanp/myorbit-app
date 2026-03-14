'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { Transaction } from '@/lib/financeData';

const INCOME_SOURCES = ['Salary', 'Freelance', 'Investments', 'Dividends', 'Rental', 'Gifts', 'Other'];

export type AddIncomeProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  onSave: (payload: Omit<Transaction, 'id'>) => void;
};

export default function AddIncomeModal({ open, onClose, accounts, onSave }: AddIncomeProps) {
  const [date, setDate]           = useState(() => new Date().toISOString().slice(0, 10));
  const [source, setSource]       = useState('Salary');
  const [description, setDesc]    = useState('');
  const [amount, setAmount]       = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');

  const canSubmit = useMemo(() =>
    !!date && !!source && !!amount && !!accountId && !isNaN(Number(amount)) && Number(amount) > 0,
  [date, source, amount, accountId]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ date, category: source, description: description.trim() || source, amount: Math.abs(Number(amount)), type: 'income', accountId });
    toast('Income recorded');
    setSource('Salary'); setDesc(''); setAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add income" subtitle="Record money received">
      <div className="space-y-5">

        <div>
          <SectionLabel>Income details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Source</label>
              <select value={source} onChange={e => setSource(e.target.value)} className={inputCls}>
                {INCOME_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center text-sm font-medium text-gray-700">Description <OptionalBadge /></label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="March paycheck" className={inputCls} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Amount & account</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="85000" type="number" className={inputCls} />
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
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            Save income
          </button>
        </div>
      </div>
    </Modal>
  );
}
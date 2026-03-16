'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { AccountTypeName } from '@/lib/financeStore';

const accountTypes: AccountTypeName[] = ['Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'];

export type AddAccountProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; type: AccountTypeName; balance: number; creditLimit?: number }) => void;
};

export default function AddAccountModal({ open, onClose, onSave }: AddAccountProps) {
  const [name, setName]               = useState('');
  const [type, setType]               = useState<AccountTypeName>('Bank');
  const [balance, setBalance]         = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const isCredit = type === 'Credit Card';

  const canSubmit = useMemo(() =>
    !!name.trim() &&
    !isNaN(Number(balance)) &&
    (!isCredit || (!!creditLimit && !isNaN(Number(creditLimit)) && Number(creditLimit) > 0)),
  [name, balance, creditLimit, isCredit]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      name: name.trim(),
      type,
      balance: isCredit ? -Math.abs(Number(balance)) : Number(balance),
      creditLimit: isCredit ? Number(creditLimit) : undefined,
    });
    toast('Account added successfully');
    setName(''); setBalance('0'); setCreditLimit('');
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
        Save account
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Add account" subtitle="Link a bank, card, wallet or cash account" footer={footer}>
      <div className="space-y-5">
        <div>
          <SectionLabel>Account details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Account name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="HDFC Savings"
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Account type</label>
              <select value={type} onChange={e => { setType(e.target.value as AccountTypeName); setCreditLimit(''); }} className={inputCls}>
                {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Balance</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isCredit ? 'Outstanding amount (₹)' : 'Current balance (₹)'}
              </label>
              <input value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" type="number" min="0"
                onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                className={inputCls} />
            </div>
            {isCredit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Credit limit (₹)</label>
                <input value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="150000" type="number" min="1"
                  onKeyDown={e => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                  className={inputCls} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { AccountTypeName } from '@/lib/financeStore';

const accountTypes: AccountTypeName[] = ['Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'];

export type AddAccountProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; type: AccountTypeName; balance: number; creditLimit?: number }) => Promise<void>;
};

export default function AddAccountModal({ open, onClose, onSave }: AddAccountProps) {
  const [name, setName]               = useState('');
  const [type, setType]               = useState<AccountTypeName>('Bank');
  const [balance, setBalance]         = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const isCredit = type === 'Credit Card';

  const canSubmit = useMemo(() =>
    !!name.trim() &&
    !isNaN(Number(balance)) &&
    (!isCredit || (!!creditLimit && !isNaN(Number(creditLimit)) && Number(creditLimit) > 0)),
  [name, balance, creditLimit, isCredit]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        balance: isCredit ? -Math.abs(Number(balance)) : Number(balance),
        creditLimit: isCredit ? Number(creditLimit) : undefined,
      });
      toast('Account added successfully');
      setName(''); setBalance('0'); setCreditLimit('');
      onClose();
    } catch (err: any) {
      toast(err?.message ?? 'Failed to add account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add account" subtitle="Link a bank, card, wallet or cash account">
      <div className="space-y-5">
        <div>
          <SectionLabel>Account details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Account name</label>
              <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="HDFC Savings" className={inputCls} />
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
              <input value={balance} onChange={e => setBalance(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="0" type="number" min="0" className={inputCls} />
            </div>
            {isCredit && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Credit limit (₹)</label>
                <input value={creditLimit} onChange={e => setCreditLimit(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="150000" type="number" min="1" className={inputCls} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save account'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

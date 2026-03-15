'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Transaction } from '@/lib/financeData';

export type TransferModalProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  onSave: (tx1: Omit<Transaction, 'id'>, tx2: Omit<Transaction, 'id'>) => void;
};

export default function TransferModal({ open, onClose, accounts, onSave }: TransferModalProps) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId,   setToId]   = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date,   setDate]   = useState(() => new Date().toISOString().slice(0, 10));
  const [note,   setNote]   = useState('');

  useEffect(() => {
    if (open) {
      setFromId(accounts[0]?.id ?? '');
      setToId(accounts[1]?.id ?? accounts[0]?.id ?? '');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    }
  }, [open]);

  const canSubmit = useMemo(() =>
    Number(amount) > 0 && !!fromId && !!toId && fromId !== toId,
  [amount, fromId, toId]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const description = note.trim() || 'Transfer';
    onSave(
      { date, category: 'Transfer', description, amount: -Number(amount), type: 'expense', accountId: fromId },
      { date, category: 'Transfer', description, amount:  Number(amount), type: 'income',  accountId: toId  },
    );
    toast('Transfer recorded');
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit}
        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
        Transfer
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Transfer" subtitle="Move money between accounts" footer={footer}>
      <div className="space-y-5">

        <div>
          <SectionLabel>From → To</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">From account</label>
              <select value={fromId} onChange={e => setFromId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">To account</label>
              <select value={toId} onChange={e => setToId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          {fromId === toId && fromId !== '' && (
            <p className="mt-1.5 text-xs text-rose-500">From and To accounts must be different.</p>
          )}
        </div>

        <div>
          <SectionLabel>Amount & details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">Note <OptionalBadge /></label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Monthly savings transfer" className={inputCls} />
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

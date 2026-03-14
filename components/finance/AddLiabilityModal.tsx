'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { Liability } from '@/lib/financeData';

export type AddLiabilityProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Liability, 'id'>) => void;
};

export default function AddLiabilityModal({ open, onClose, onSave }: AddLiabilityProps) {
  const [name, setName]               = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [emi, setEmi]                 = useState('');

  const canSubmit = useMemo(() =>
    !!name.trim() && !isNaN(Number(outstanding)) && Number(outstanding) > 0 && !isNaN(Number(emi)) && Number(emi) > 0,
  [name, outstanding, emi]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ name: name.trim(), outstanding: Number(outstanding), monthlyEmi: Number(emi) });
    setName(''); setOutstanding(''); setEmi('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add liability" subtitle="Track a loan or outstanding debt">
      <div className="space-y-5">

        <div>
          <SectionLabel>Liability details</SectionLabel>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Home Loan" className={inputCls} />
          </div>
        </div>

        <div>
          <SectionLabel>Repayment</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Outstanding amount (₹)</label>
              <input value={outstanding} onChange={e => setOutstanding(e.target.value)} placeholder="210000" type="number" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Monthly EMI (₹)</label>
              <input value={emi} onChange={e => setEmi(e.target.value)} placeholder="18500" type="number" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            Save liability
          </button>
        </div>
      </div>
    </Modal>
  );
}
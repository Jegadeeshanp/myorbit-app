'use client';

import { useMemo, useState } from 'react';
import Modal from './Modal';
import { Liability } from '@/lib/financeData';

export type AddLiabilityProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Liability, 'id'>) => void;
};

export default function AddLiabilityModal({ open, onClose, onSave }: AddLiabilityProps) {
  const [name, setName] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [emi, setEmi] = useState('');

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    return !isNaN(Number(outstanding)) && Number(outstanding) > 0 && !isNaN(Number(emi)) && Number(emi) > 0;
  }, [name, outstanding, emi]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSave({
      name: name.trim(),
      outstanding: Number(outstanding),
      monthlyEmi: Number(emi),
    });

    setName('');
    setOutstanding('');
    setEmi('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add liability">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Liability name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Home loan"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Outstanding amount</label>
            <input
              value={outstanding}
              onChange={(e) => setOutstanding(e.target.value)}
              placeholder="210000"
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly EMI</label>
            <input
              value={emi}
              onChange={(e) => setEmi(e.target.value)}
              placeholder="18500"
              type="number"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
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
            Save liability
          </button>
        </div>
      </div>
    </Modal>
  );
}

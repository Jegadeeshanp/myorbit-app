'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { Asset } from '@/lib/financeData';

const categories: Asset['category'][] = ['Stocks', 'Mutual Funds', 'Real Estate', 'Gold'];

export type AddAssetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Asset, 'id'>) => void;
};

export default function AddAssetModal({ open, onClose, onSave }: AddAssetProps) {
  const [name, setName]         = useState('');
  const [category, setCategory] = useState<Asset['category']>('Stocks');
  const [value, setValue]       = useState('');

  const canSubmit = useMemo(() =>
    !!name.trim() && !isNaN(Number(value)) && Number(value) > 0,
  [name, value]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ name: name.trim(), category, value: Number(value) });
    setName(''); setValue('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add asset" subtitle="Track an investment or property">
      <div className="space-y-5">

        <div>
          <SectionLabel>Asset details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Asset name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Reliance Stock" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as Asset['category'])} className={inputCls}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Valuation</SectionLabel>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Current value (₹)</label>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="45000" type="number" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            Save asset
          </button>
        </div>
      </div>
    </Modal>
  );
}
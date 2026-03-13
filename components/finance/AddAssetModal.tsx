'use client';

import { useMemo, useState } from 'react';
import Modal from './Modal';
import { Asset } from '@/lib/financeData';

const categories: Asset['category'][] = ['Stocks', 'Mutual Funds', 'Real Estate', 'Gold'];

export type AddAssetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Asset, 'id'>) => void;
};

export default function AddAssetModal({ open, onClose, onSave }: AddAssetProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Asset['category']>('Stocks');
  const [value, setValue] = useState('');

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!value) return false;
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }, [name, value]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSave({
      name: name.trim(),
      category,
      value: Number(value),
    });

    setName('');
    setValue('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add asset">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Asset name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Reliance Stock"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Asset['category'])}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Value</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="45000"
            type="number"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
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
            Save asset
          </button>
        </div>
      </div>
    </Modal>
  );
}

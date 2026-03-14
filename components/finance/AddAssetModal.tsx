'use client';

import { useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { ASSET_CATEGORIES, AssetCategory } from '@/lib/assetCategories';

export type AddAssetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; category: AssetCategory; value: number; invested: number }) => void;
};

export default function AddAssetModal({ open, onClose, onSave }: AddAssetProps) {
  const [name, setName]         = useState('');
  const [category, setCategory] = useState<AssetCategory>('Stocks & Equity');
  const [value, setValue]       = useState('');
  const [invested, setInvested] = useState('');

  const canSubmit = useMemo(() =>
    !!name.trim() && Number(value) > 0 && Number(invested) > 0,
  [name, value, invested]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ name: name.trim(), category, value: Number(value), invested: Number(invested) });
    toast('Asset added');
    setName(''); setValue(''); setInvested('');
    onClose();
  };

  const selected = ASSET_CATEGORIES.find(c => c.label === category)!;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
        Save asset
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Add asset" subtitle="Select a category and enter details" footer={footer}>
      <div className="space-y-5">

        {/* Category grid */}
        <div>
          <SectionLabel>Asset class</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {ASSET_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  title={cat.label}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition ${
                    isSelected
                      ? `border-emerald-400 bg-emerald-50 ${cat.color}`
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? cat.color : 'text-gray-400'}`} />
                  <span className={`text-[10px] font-medium leading-tight ${isSelected ? cat.color : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected category pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Selected:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${selected.tagBg} ${selected.tagText}`}>
            <selected.icon className="h-3 w-3" />
            {selected.label}
          </span>
        </div>

        {/* Asset details */}
        <div>
          <SectionLabel>Asset details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Asset name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`e.g. ${category === 'Stocks & Equity' ? 'Reliance Industries' : category === 'Real Estate' ? 'Mumbai Apartment' : category === 'Mutual Funds' ? 'Nifty 50 Index Fund' : 'My ' + category}`}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount invested (₹)</label>
              <input value={invested} onChange={e => setInvested(e.target.value)} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Current value (₹)</label>
              <input value={value} onChange={e => setValue(e.target.value)} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
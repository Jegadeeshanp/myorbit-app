'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Asset } from '@/lib/financeData';
import { ASSET_CATEGORIES, AssetCategory } from '@/lib/assetCategories';

export type AddAssetProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; category: AssetCategory; value: number; invested: number }) => Promise<void> | void;
  initial?: Asset;
};

export default function AddAssetModal({ open, onClose, onSave, initial }: AddAssetProps) {
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState<AssetCategory>('Stocks & Equity');
  const [value,    setValue]    = useState('');
  const [invested, setInvested] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setCategory(initial?.category ?? 'Stocks & Equity');
      setValue(initial ? String(initial.value) : '');
      setInvested(initial ? String(initial.invested) : '');
    }
  }, [open]);

  const canSubmit = useMemo(() =>
    !!name.trim() && Number(value) > 0 && Number(invested) > 0,
  [name, value, invested]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), category, value: Number(value), invested: Number(invested) });
      toast(initial ? 'Asset updated' : 'Asset added');
      onClose();
    } catch {
      toast('Failed to save asset. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selected = ASSET_CATEGORIES.find(c => c.label === category)!;
  const isEdit = !!initial;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit || saving}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? 'Saving…' : isEdit ? 'Update asset' : 'Save asset'}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit asset' : 'Add asset'} subtitle="Select a category and enter details" footer={footer}>
      <div className="space-y-5">

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
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition active:scale-95 ${
                    isSelected
                      ? `border-2 ${cat.color.replace('text-', 'border-')} ${cat.bg}`
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  {/* Icon always on accent background for quick-action feel */}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.bg}`}>
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${isSelected ? cat.color : 'text-gray-500'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Selected:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${selected.tagBg} ${selected.tagText}`}>
            <selected.icon className="h-3 w-3" />
            {selected.label}
          </span>
        </div>

        <div>
          <SectionLabel>Asset details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Asset name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={`e.g. ${category === 'Stocks & Equity' ? 'Reliance Industries' : category === 'Real Estate' ? 'Mumbai Apartment' : 'My ' + category}`}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Amount invested (₹)</label>
              <input value={invested} onChange={e => setInvested(e.target.value)} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">Current value (₹)</label>
              <input value={value} onChange={e => setValue(e.target.value)} placeholder="0" type="number" min="1" className={inputCls} />
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

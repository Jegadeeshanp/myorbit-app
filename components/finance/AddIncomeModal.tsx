'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Transaction } from '@/lib/financeData';
import { INCOME_CATEGORIES, type CategoryDef } from './CategoryPicker';

export type AddIncomeProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string }[];
  onSave: (payload: Omit<Transaction, 'id'>) => void;
  initial?: Transaction;
};

// ── Inline category chip grid (no add-new for income) ─────────────────────
function IncomeCategoryGrid({
  categories,
  value,
  onChange,
}: {
  categories: CategoryDef[];
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {categories.map(cat => {
        const Icon = cat.icon;
        const isActive = cat.name === value;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onChange(cat.name)}
            className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
              isActive
                ? `${cat.bg} ${cat.color} ring-1 ring-current/30`
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg ${isActive ? 'bg-white/60' : cat.bg}`}>
              <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
            </span>
            <span className="truncate leading-tight">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export default function AddIncomeModal({ open, onClose, accounts, onSave, initial }: AddIncomeProps) {
  const [date,        setDate]      = useState(() => new Date().toISOString().slice(0, 10));
  const [category,    setCategory]  = useState(INCOME_CATEGORIES[0].name);
  const [description, setDesc]      = useState('');
  const [note,        setNote]      = useState('');
  const [amount,      setAmount]    = useState('');
  const [accountId,   setAccountId] = useState(accounts[0]?.id ?? '');

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? new Date().toISOString().slice(0, 10));
      setCategory(initial?.category ?? INCOME_CATEGORIES[0].name);
      if (initial?.description) {
        const parts = initial.description.split('\n');
        setDesc(parts[0] ?? '');
        setNote(parts.slice(1).join('\n'));
      } else {
        setDesc('');
        setNote('');
      }
      setAmount(initial ? String(Math.abs(initial.amount)) : '');
      setAccountId(initial?.accountId ?? accounts[0]?.id ?? '');
    }
  }, [open]);

  const canSubmit = useMemo(() =>
    !!date && !!category && !!description.trim() && Number(amount) > 0 && !!accountId,
  [date, category, description, amount, accountId]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const desc = note.trim() ? `${description.trim()}\n${note.trim()}` : description.trim();
    onSave({ date, category, description: desc, amount: Math.abs(Number(amount)), type: 'income', accountId });
    toast(initial ? 'Income updated' : 'Income recorded');
    onClose();
  };

  const isEdit = !!initial;

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button type="button" onClick={handleSubmit} disabled={!canSubmit}
        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
        {isEdit ? 'Update income' : 'Save income'}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit income' : 'Add income'} subtitle="Record money received" footer={footer}>
      <div className="space-y-5">

        {/* Category */}
        <div>
          <SectionLabel>Category</SectionLabel>
          <IncomeCategoryGrid
            categories={INCOME_CATEGORIES}
            value={category}
            onChange={setCategory}
          />
        </div>

        {/* Details */}
        <div>
          <SectionLabel>Details</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <input value={description} onChange={e => setDesc(e.target.value)} placeholder="March paycheck" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="85000" type="number" min="0" className={inputCls} />
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
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                Note <OptionalBadge />
              </label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" className={inputCls} />
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

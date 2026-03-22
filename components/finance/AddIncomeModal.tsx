'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Modal, { SectionLabel, OptionalBadge, inputCls } from './Modal';
import { toast } from '@/components/Toast';
import { Transaction } from '@/lib/financeData';
import { INCOME_CATEGORIES, ICON_OPTIONS, type CategoryDef } from './CategoryPicker';
import { Plus, X, Package, Check } from 'lucide-react';
import { getCustomIncomeCategoryDefs, addCustomIncomeCategory } from '@/lib/customCategoryStore';

export type AddIncomeProps = {
  open: boolean;
  onClose: () => void;
  accounts: { id: string; name: string; type?: string }[];
  onSave: (payload: Omit<Transaction, 'id'>) => void;
  initial?: Transaction;
};

// ── Inline category chip grid ──────────────────────────────────────────────
function IncomeCategoryGrid({
  categories,
  value,
  onChange,
}: {
  categories: CategoryDef[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [addMode, setAddMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState<ComponentType<{ className?: string }>>(Package);
  const [extras, setExtras] = useState<CategoryDef[]>([]);

  // Load persisted custom categories (with their saved icons) on every mount
  useEffect(() => {
    const defaultNames = categories.map(c => c.name);
    const saved = getCustomIncomeCategoryDefs().filter(c => !defaultNames.includes(c.name));
    setExtras(saved.map(({ name, icon: iconName }) => {
      const iconDef = ICON_OPTIONS.find(o => o.name === iconName);
      return { name, icon: iconDef?.icon ?? Package, color: 'text-gray-700', bg: 'bg-gray-100' };
    }));
  }, []);

  const allCats = [...categories, ...extras];

  function confirmCustom() {
    if (!customName.trim()) return;
    const newCat: CategoryDef = {
      name: customName.trim(),
      icon: customIcon,
      color: 'text-gray-700',
      bg: 'bg-gray-100',
    };
    setExtras(prev => [...prev, newCat]);
    const iconName = ICON_OPTIONS.find(o => o.icon === customIcon)?.name ?? 'Package';
    addCustomIncomeCategory(newCat.name, iconName); // persist name + icon
    onChange(newCat.name);
    setCustomName('');
    setCustomIcon(Package);
    setAddMode(false);
  }

  return (
    <div className="space-y-3">
      {/* Category chips — 3-col grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {allCats.map(cat => {
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

        {/* Add category button */}
        {!addMode && (
          <button
            type="button"
            onClick={() => setAddMode(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-400 transition hover:border-emerald-400 hover:text-emerald-600"
          >
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-gray-100">
              <Plus className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">Add new</span>
          </button>
        )}
      </div>

      {/* Inline add form */}
      {addMode && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">New category</p>
            <button type="button" onClick={() => setAddMode(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-200">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmCustom(); } }}
            placeholder="Category name…"
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          {/* Icon picker — colored icons */}
          <div>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">Icon</p>
            <div className="grid grid-cols-9 gap-1">
              {ICON_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSel = customIcon === opt.icon;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setCustomIcon(() => opt.icon)}
                    title={opt.name}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      isSel ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400' : `${opt.color} hover:bg-gray-200`
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {customName && (
              <div className="flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
                {(() => { const I = customIcon; return <I className="h-3 w-3" />; })()}
                {customName}
              </div>
            )}
            <button
              type="button"
              onClick={confirmCustom}
              disabled={!customName.trim()}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Add
            </button>
          </div>
        </div>
      )}
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
      setDesc(initial?.description ?? '');
      setNote(initial?.notes ?? '');
      setAmount(initial ? String(Math.abs(initial.amount)) : '');
      setAccountId(initial?.accountId ?? accounts[0]?.id ?? '');
    }
  }, [open]);

  const canSubmit = useMemo(() =>
    !!date && !!category && !!description.trim() && Number(amount) > 0 && !!accountId,
  [date, category, description, amount, accountId]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ date, category, description: description.trim(), notes: note.trim() || undefined, amount: Math.abs(Number(amount)), type: 'income', accountId });
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
        className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
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
              <input value={description} onChange={e => setDesc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="March paycheck" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }} placeholder="85000" type="number" min="0" onWheel={e => e.currentTarget.blur()} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.type ? ` – ${a.type === 'Credit Card' ? 'Credit' : a.type === 'Debit Card' ? 'Debit' : a.type}` : ''}</option>)}
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
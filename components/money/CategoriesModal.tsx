'use client';

import { useState } from 'react';
import { Plus, Trash2, Tag, ShoppingCart, Car, ShoppingBag, Zap, Heart, Film, BookOpen, Plane, Package, Briefcase, Code, TrendingUp, Gift, Home } from 'lucide-react';
import Modal from '@/components/money/Modal';

type CategoryType = 'expense' | 'income';

const DEFAULT_CATEGORIES: Record<CategoryType, string[]> = {
  expense: ['Groceries', 'Transport', 'Shopping', 'Bills & Utilities', 'Healthcare', 'Entertainment', 'Education', 'Travel', 'Others'],
  income:  ['Salary', 'Freelance', 'Dividends', 'Gifts', 'Rental Income'],
};

const EXPENSE_ICONS: Record<string, React.ElementType> = {
  Groceries: ShoppingCart,
  Transport: Car,
  Shopping: ShoppingBag,
  'Bills & Utilities': Zap,
  Healthcare: Heart,
  Entertainment: Film,
  Education: BookOpen,
  Travel: Plane,
  Others: Package,
};

const INCOME_ICONS: Record<string, React.ElementType> = {
  Salary: Briefcase,
  Freelance: Code,
  Dividends: TrendingUp,
  Gifts: Gift,
  'Rental Income': Home,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CategoriesModal({ open, onClose }: Props) {
  const [type, setType] = useState<CategoryType>('expense');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || categories[type].includes(trimmed)) return;
    setCategories(c => ({ ...c, [type]: [...c[type], trimmed] }));
    setNewName('');
  };

  const handleDelete = (cat: string) => {
    setCategories(c => ({ ...c, [type]: c[type].filter(x => x !== cat) }));
  };

  const iconMap = type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;

  return (
    <Modal
      open={open}
      title="Categories"
      subtitle="Manage your expense and income categories"
      onClose={onClose}
    >
      {/* Type toggle */}
      <div className="mb-4 flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(['expense', 'income'] as CategoryType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
              type === t
                ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="New category name"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button onClick={handleAdd} disabled={!newName.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Category list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {type === 'expense' ? 'Expense' : 'Income'} categories
          </p>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
            {categories[type].length}
          </span>
        </div>

        {categories[type].length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Tag className="h-6 w-6 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No categories yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {categories[type].map(cat => {
              const Icon = iconMap[cat] ?? Tag;
              return (
                <div key={cat} className="flex items-center justify-between px-4 py-2.5 transition hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-400 flex-none" />
                    <span className="text-sm font-medium text-gray-800">{cat}</span>
                  </div>
                  <button onClick={() => handleDelete(cat)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        {categories[type].length} {type} {categories[type].length === 1 ? 'category' : 'categories'}
      </p>
    </Modal>
  );
}

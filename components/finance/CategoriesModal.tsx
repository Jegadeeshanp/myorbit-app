'use client';

import { useState } from 'react';
import { Plus, Trash2, Tag, ShoppingCart, Car, ShoppingBag, Zap, Heart, Film, BookOpen, Plane, Package, Briefcase, Code, TrendingUp, Gift, Home } from 'lucide-react';
import Modal from '@/components/finance/Modal';
import {
  getCustomExpenseCategories, addCustomExpenseCategory, removeCustomExpenseCategory,
  getCustomIncomeCategories,  addCustomIncomeCategory,  removeCustomIncomeCategory,
} from '@/lib/customCategoryStore';

type CategoryType = 'expense' | 'income';

const BUILTIN_CATEGORIES: Record<CategoryType, string[]> = {
  expense: ['Rent', 'Groceries', 'Restaurants', 'Fuel', 'Transport', 'Utilities', 'Internet', 'Mobile', 'Shopping', 'Subscriptions', 'Medical', 'Insurance', 'Travel', 'Education', 'Gifts', 'Miscellaneous'],
  income:  ['Salary', 'Bonus', 'Freelance', 'Business', 'Dividends', 'Interest', 'Rental Income', 'Cashback', 'Refund', 'Other Income'],
};

const EXPENSE_ICONS: Record<string, React.ElementType> = {
  Groceries: ShoppingCart,
  Transport: Car,
  Shopping:  ShoppingBag,
  Utilities: Zap,
  Medical:   Heart,
  Entertainment: Film,
  Education: BookOpen,
  Travel:    Plane,
};

const INCOME_ICONS: Record<string, React.ElementType> = {
  Salary:    Briefcase,
  Freelance: Code,
  Dividends: TrendingUp,
  Gifts:     Gift,
  'Rental Income': Home,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CategoriesModal({ open, onClose }: Props) {
  const [type, setType] = useState<CategoryType>('expense');
  const [newName, setNewName] = useState('');

  // Initialize with built-in + custom categories from localStorage
  const [customExpense, setCustomExpense] = useState<string[]>(() => getCustomExpenseCategories());
  const [customIncome,  setCustomIncome]  = useState<string[]>(() => getCustomIncomeCategories());

  const builtins = BUILTIN_CATEGORIES[type];
  const customs  = type === 'expense' ? customExpense : customIncome;
  const allCats  = [...builtins, ...customs.filter(c => !builtins.includes(c))];

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || allCats.includes(trimmed)) return;
    if (type === 'expense') {
      addCustomExpenseCategory(trimmed);
      setCustomExpense(getCustomExpenseCategories());
    } else {
      addCustomIncomeCategory(trimmed);
      setCustomIncome(getCustomIncomeCategories());
    }
    setNewName('');
  };

  const handleDelete = (cat: string) => {
    // Only allow deleting custom categories, not built-ins
    if (builtins.includes(cat)) return;
    if (type === 'expense') {
      removeCustomExpenseCategory(cat);
      setCustomExpense(getCustomExpenseCategories());
    } else {
      removeCustomIncomeCategory(cat);
      setCustomIncome(getCustomIncomeCategories());
    }
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
            {allCats.length}
          </span>
        </div>

        {allCats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Tag className="h-6 w-6 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No categories yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {allCats.map(cat => {
              const Icon = iconMap[cat] ?? Tag;
              const isBuiltin = builtins.includes(cat);
              return (
                <div key={cat} className="flex items-center justify-between px-4 py-2.5 transition hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-400 flex-none" />
                    <span className="text-sm font-medium text-gray-800">{cat}</span>
                    {isBuiltin && (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">built-in</span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(cat)}
                    disabled={isBuiltin}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      isBuiltin ? 'cursor-not-allowed text-gray-200' : 'text-gray-300 hover:bg-rose-50 hover:text-rose-400'
                    }`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        {allCats.length} {type} {allCats.length === 1 ? 'category' : 'categories'} • {customs.length} custom
      </p>
    </Modal>
  );
}

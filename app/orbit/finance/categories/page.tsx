'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Tag, ShoppingCart, Car, ShoppingBag, Zap, Heart, Film, BookOpen, Plane, Package, Briefcase, Code, TrendingUp, Gift, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getAllExpenseCategories,
  getAllIncomeCategories,
  addCustomExpenseCategory,
  addCustomIncomeCategory,
  removeCustomExpenseCategory,
  removeCustomIncomeCategory,
} from '@/lib/customCategoryStore';

type CategoryType = 'expense' | 'income';

// Default categories that cannot be deleted
const DEFAULT_EXPENSE = new Set(['Food', 'Transport', 'Shopping', 'Bills', 'Healthcare', 'Entertainment', 'Education', 'Travel', 'Others']);
const DEFAULT_INCOME  = new Set(['Salary', 'Freelance', 'Business', 'Dividends', 'Rental Income', 'Gifts', 'Refunds', 'Other Income']);

const EXPENSE_ICONS: Record<string, React.ElementType> = {
  Food: ShoppingCart,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Zap,
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
  Business: TrendingUp,
  Gifts: Gift,
  'Rental Income': Home,
};

export default function CategoriesPage() {
  const router = useRouter();
  const [type, setType] = useState<CategoryType>('expense');
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats]   = useState<string[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setExpenseCats(getAllExpenseCategories());
    setIncomeCats(getAllIncomeCategories());
  }, []);

  const categories = type === 'expense' ? expenseCats : incomeCats;

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    if (type === 'expense') {
      addCustomExpenseCategory(trimmed);
      setExpenseCats(getAllExpenseCategories());
    } else {
      addCustomIncomeCategory(trimmed);
      setIncomeCats(getAllIncomeCategories());
    }
    setNewName('');
  };

  const handleDelete = (cat: string) => {
    if (type === 'expense') {
      if (DEFAULT_EXPENSE.has(cat)) return;
      removeCustomExpenseCategory(cat);
      setExpenseCats(getAllExpenseCategories());
    } else {
      if (DEFAULT_INCOME.has(cat)) return;
      removeCustomIncomeCategory(cat);
      setIncomeCats(getAllIncomeCategories());
    }
  };

  const defaultSet = type === 'expense' ? DEFAULT_EXPENSE : DEFAULT_INCOME;
  const iconMap    = type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-lg px-4 py-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Categories</h1>
            <p className="text-xs text-gray-400">Manage your expense and income categories</p>
          </div>
        </div>

        {/* Type toggle */}
        <div className="mb-5 flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {(['expense', 'income'] as CategoryType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
                type === t
                  ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Add form */}
        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New category name"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button onClick={handleAdd} disabled={!newName.trim()}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Category list */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {type === 'expense' ? 'Expense' : 'Income'} categories
            </p>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
              {categories.length}
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="h-7 w-7 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categories.map(cat => {
                const Icon      = iconMap[cat] ?? Tag;
                const isDefault = defaultSet.has(cat);
                return (
                  <div key={cat} className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-gray-400 flex-none" />
                      <span className="text-sm font-medium text-gray-800">{cat}</span>
                      {isDefault && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">default</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={isDefault}
                      title={isDefault ? 'Default categories cannot be deleted' : 'Delete'}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-rose-50 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-gray-400">
          {categories.length} {type} {categories.length === 1 ? 'category' : 'categories'}
        </p>
      </div>
    </div>
  );
}

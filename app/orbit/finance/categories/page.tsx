'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CategoryType = 'expense' | 'income';

const DEFAULT_CATEGORIES: Record<CategoryType, string[]> = {
  expense: ['Groceries','Transport','Shopping','Bills & Utilities','Healthcare','Entertainment','Education'],
  income:  ['Salary','Freelance','Dividends','Gifts','Rental Income'],
};

export default function CategoriesPage() {
  const router = useRouter();
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

  const expenseEmojis: Record<string, string> = {
    Groceries: '🛒', Transport: '🚗', Shopping: '🛍️', 'Bills & Utilities': '⚡',
    Healthcare: '💊', Entertainment: '🎬', Education: '📚', 'Food & Dining': '🍽️',
    Travel: '✈️', Others: '📦',
  };
  const incomeEmojis: Record<string, string> = {
    Salary: '💼', Freelance: '💻', Dividends: '📈', Gifts: '🎁', 'Rental Income': '🏠',
  };
  const emojiMap = type === 'expense' ? expenseEmojis : incomeEmojis;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="mx-auto max-w-lg px-4 py-6">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Custom Categories</h1>
        </div>

        {/* Type toggle */}
        <div className="mb-6 flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
          {(['expense', 'income'] as CategoryType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
                type === t
                  ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Add form */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Category name"
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Category list */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {type === 'expense' ? 'Expense' : 'Income'} Categories
              <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-gray-600">{categories[type].length}</span>
            </p>
          </div>

          {categories[type].length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No categories yet</p>
              <p className="text-xs text-gray-300 mt-1">Add one above</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categories[type].map((cat, i) => (
                <div
                  key={cat}
                  className="flex items-center justify-between px-5 py-3.5 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{emojiMap[cat] || (type === 'expense' ? '📦' : '💰')}</span>
                    <span className="text-sm font-medium text-gray-900">{cat}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          {categories[type].length} {type} categories total
        </p>
      </div>
    </div>
  );
}

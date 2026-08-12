'use client';

import { useState, useRef, useEffect, type ComponentType } from 'react';
import {
  getCustomExpenseCategoryDefs, getCustomIncomeCategoryDefs,
  addCustomExpenseCategoryDB, addCustomIncomeCategoryDB,
} from '@/lib/customCategoryStore';
import { ChevronDown, Plus, X, Check } from 'lucide-react';
import {
  Home, ShoppingCart, Utensils, Fuel, Bus, Zap, Wifi, Smartphone, ShoppingBag,
  RefreshCw, Stethoscope, Shield, Plane, GraduationCap, Gift, Package,
  Briefcase, Award, Laptop, Building2, TrendingUp, Percent, RotateCcw, Undo2,
  Car, Coffee, Heart, Music, BookOpen, Star, Tag, Dumbbell, Camera, Globe,
  Wrench, Film, Train, Bike, PawPrint, Scissors, Baby, Gauge, Receipt, HeartPulse,
  Landmark, PiggyBank,
} from 'lucide-react';

export type CategoryDef = {
  name: string;
  icon: ComponentType<{ className?: string }>;
  color: string;  // Tailwind text color class
  bg: string;     // Tailwind bg color class
};

// ── Expense categories ─────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Rent',          icon: Home,          color: 'text-violet-600',  bg: 'bg-violet-100' },
  { name: 'Groceries',     icon: ShoppingCart,  color: 'text-green-600',   bg: 'bg-green-100'  },
  { name: 'Restaurants',   icon: Utensils,      color: 'text-orange-600',  bg: 'bg-orange-100' },
  { name: 'Fuel',          icon: Fuel,          color: 'text-amber-600',   bg: 'bg-amber-100'  },
  { name: 'Transport',     icon: Bus,           color: 'text-blue-600',    bg: 'bg-blue-100'   },
  { name: 'Utilities',     icon: Zap,           color: 'text-yellow-600',  bg: 'bg-yellow-100' },
  { name: 'Internet',      icon: Wifi,          color: 'text-sky-600',     bg: 'bg-sky-100'    },
  { name: 'Mobile',        icon: Smartphone,    color: 'text-cyan-600',    bg: 'bg-cyan-100'   },
  { name: 'Shopping',      icon: ShoppingBag,   color: 'text-pink-600',    bg: 'bg-pink-100'   },
  { name: 'Subscriptions', icon: RefreshCw,     color: 'text-indigo-600',  bg: 'bg-indigo-100' },
  { name: 'Medical',       icon: Stethoscope,   color: 'text-red-600',     bg: 'bg-red-100'    },
  { name: 'Insurance',     icon: Shield,        color: 'text-teal-600',    bg: 'bg-teal-100'   },
  { name: 'Travel',        icon: Plane,         color: 'text-sky-700',     bg: 'bg-sky-100'    },
  { name: 'Education',     icon: GraduationCap, color: 'text-indigo-700',  bg: 'bg-indigo-100' },
  { name: 'Gifts',         icon: Gift,          color: 'text-rose-600',    bg: 'bg-rose-100'   },
  { name: 'Miscellaneous', icon: Package,       color: 'text-gray-600',    bg: 'bg-gray-100'   },
  { name: 'Food',          icon: Coffee,        color: 'text-amber-700',   bg: 'bg-amber-100'  },
  { name: 'Bills',         icon: Receipt,       color: 'text-slate-600',   bg: 'bg-slate-100'  },
  { name: 'Healthcare',    icon: HeartPulse,    color: 'text-red-500',     bg: 'bg-red-100'    },
  { name: 'Entertainment', icon: Film,          color: 'text-purple-600',  bg: 'bg-purple-100' },
  { name: 'Loan',          icon: Landmark,      color: 'text-orange-700',  bg: 'bg-orange-100' },
  { name: 'Investment',    icon: PiggyBank,     color: 'text-teal-600',    bg: 'bg-teal-100'   },
  { name: 'Others',        icon: Tag,           color: 'text-gray-500',    bg: 'bg-gray-100'   },
];

// ── Income categories ──────────────────────────────────────────────────────
export const INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salary',        icon: Briefcase,    color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { name: 'Bonus',         icon: Award,        color: 'text-green-600',   bg: 'bg-green-100'   },
  { name: 'Freelance',     icon: Laptop,       color: 'text-blue-600',    bg: 'bg-blue-100'    },
  { name: 'Business',      icon: Building2,    color: 'text-violet-600',  bg: 'bg-violet-100'  },
  { name: 'Dividends',     icon: TrendingUp,   color: 'text-teal-600',    bg: 'bg-teal-100'    },
  { name: 'Interest',      icon: Percent,      color: 'text-cyan-700',    bg: 'bg-cyan-100'    },
  { name: 'Rental Income', icon: Home,         color: 'text-amber-600',   bg: 'bg-amber-100'   },
  { name: 'Cashback',      icon: RotateCcw,    color: 'text-lime-700',    bg: 'bg-lime-100'    },
  { name: 'Refund',        icon: Undo2,        color: 'text-slate-600',   bg: 'bg-slate-100'   },
  { name: 'Gifts',         icon: Gift,         color: 'text-rose-600',    bg: 'bg-rose-100'    },
  { name: 'Other Income',  icon: Package,      color: 'text-gray-600',    bg: 'bg-gray-100'    },
];

// ── Icon options for custom category picker (with subtle colors) ────────────
export const ICON_OPTIONS: { name: string; icon: ComponentType<{ className?: string }>; color: string }[] = [
  { name: 'Home',       icon: Home,          color: 'text-violet-500'  },
  { name: 'Cart',       icon: ShoppingCart,  color: 'text-green-500'   },
  { name: 'Food',       icon: Utensils,      color: 'text-orange-500'  },
  { name: 'Fuel',       icon: Fuel,          color: 'text-amber-500'   },
  { name: 'Car',        icon: Car,           color: 'text-amber-600'   },
  { name: 'Bus',        icon: Bus,           color: 'text-blue-500'    },
  { name: 'Train',      icon: Train,         color: 'text-blue-600'    },
  { name: 'Bike',       icon: Bike,          color: 'text-lime-600'    },
  { name: 'Coffee',     icon: Coffee,        color: 'text-amber-700'   },
  { name: 'Zap',        icon: Zap,           color: 'text-yellow-500'  },
  { name: 'Wifi',       icon: Wifi,          color: 'text-sky-500'     },
  { name: 'Phone',      icon: Smartphone,    color: 'text-cyan-600'    },
  { name: 'Bag',        icon: ShoppingBag,   color: 'text-pink-500'    },
  { name: 'Gift',       icon: Gift,          color: 'text-rose-500'    },
  { name: 'Heart',      icon: Heart,         color: 'text-rose-400'    },
  { name: 'Music',      icon: Music,         color: 'text-purple-500'  },
  { name: 'Book',       icon: BookOpen,      color: 'text-indigo-500'  },
  { name: 'Film',       icon: Film,          color: 'text-purple-600'  },
  { name: 'Camera',     icon: Camera,        color: 'text-slate-500'   },
  { name: 'Dumbbell',   icon: Dumbbell,      color: 'text-orange-600'  },
  { name: 'Globe',      icon: Globe,         color: 'text-teal-500'    },
  { name: 'Wrench',     icon: Wrench,        color: 'text-slate-400'   },
  { name: 'Star',       icon: Star,          color: 'text-yellow-500'  },
  { name: 'Tag',        icon: Tag,           color: 'text-gray-500'    },
  { name: 'Package',    icon: Package,       color: 'text-gray-400'    },
  { name: 'Shield',     icon: Shield,        color: 'text-teal-600'    },
  { name: 'Plane',      icon: Plane,         color: 'text-sky-600'     },
  { name: 'School',     icon: GraduationCap, color: 'text-indigo-600'  },
  { name: 'Medical',    icon: Stethoscope,   color: 'text-red-500'     },
  { name: 'Briefcase',  icon: Briefcase,     color: 'text-slate-600'   },
  { name: 'Award',      icon: Award,         color: 'text-amber-500'   },
  { name: 'Laptop',     icon: Laptop,        color: 'text-blue-600'    },
  { name: 'Building',   icon: Building2,     color: 'text-slate-500'   },
  { name: 'Percent',    icon: Percent,       color: 'text-green-600'   },
  { name: 'Scissors',   icon: Scissors,      color: 'text-slate-400'   },
  { name: 'Baby',       icon: Baby,          color: 'text-pink-400'    },
  { name: 'Paw',        icon: PawPrint,      color: 'text-orange-400'  },
  { name: 'Gauge',      icon: Gauge,         color: 'text-amber-600'   },
  { name: 'Receipt',    icon: Receipt,       color: 'text-slate-500'   },
  { name: 'HeartPulse', icon: HeartPulse,    color: 'text-red-500'     },
  { name: 'Landmark',   icon: Landmark,      color: 'text-orange-600'  },
  { name: 'PiggyBank',  icon: PiggyBank,     color: 'text-teal-500'    },
];

// Derives a Tailwind bg class from an ICON_OPTIONS color class
// e.g. 'text-amber-700' → 'bg-amber-100'
function iconColorToBg(color: string): string {
  return color.replace(/^text-/, 'bg-').replace(/-\d+$/, '-100');
}

// Helper used by TransactionList to get color for a category
export function getCategoryStyle(name: string, type: 'expense' | 'income' | 'transfer') {
  if (type === 'income') {
    return INCOME_CATEGORIES.find(c => c.name === name) ?? { color: 'text-emerald-700', bg: 'bg-emerald-100' };
  }
  if (name === 'Transfer') return { color: 'text-blue-600', bg: 'bg-blue-100' };
  return EXPENSE_CATEGORIES.find(c => c.name === name) ?? { color: 'text-gray-600', bg: 'bg-gray-100' };
}

// ── Component ──────────────────────────────────────────────────────────────
type Props = {
  categories: CategoryDef[];
  value: string;
  onChange: (name: string) => void;
  allowAdd?: boolean;
  type?: 'expense' | 'income';
};

export default function CategoryPicker({ categories, value, onChange, allowAdd = false, type = 'expense' }: Props) {
  const [open, setOpen]           = useState(false);
  const [addMode, setAddMode]     = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState<ComponentType<{ className?: string }>>(Package);
  const [extraCats, setExtraCats] = useState<CategoryDef[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Reload custom categories every time the dropdown opens so DB-synced categories appear
  useEffect(() => {
    if (!open) return;
    const stored = type === 'income'
      ? getCustomIncomeCategoryDefs()
      : getCustomExpenseCategoryDefs();
    const defs: CategoryDef[] = stored.map(s => {
      const opt = ICON_OPTIONS.find(o => o.name === s.icon);
      const color = opt?.color ?? 'text-gray-700';
      return {
        name: s.name,
        icon: opt?.icon ?? Package,
        color,
        bg: iconColorToBg(color),
      };
    });
    setExtraCats(defs);
  }, [open, type]);

  const allCats = [...categories, ...extraCats]
    .filter((cat, idx, arr) => arr.findIndex(c => c.name === cat.name) === idx);
  const selected = allCats.find(c => c.name === value) ?? allCats[0];

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAddMode(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function select(cat: CategoryDef) {
    onChange(cat.name);
    setOpen(false);
    setAddMode(false);
  }

  function confirmCustom() {
    if (!customName.trim()) return;
    const name = customName.trim();
    const iconOption = ICON_OPTIONS.find(o => o.icon === customIcon);
    const iconName = iconOption?.name ?? 'Package';
    const color = iconOption?.color ?? 'text-gray-700';
    const newCat: CategoryDef = {
      name,
      icon: customIcon,
      color,
      bg: iconColorToBg(color),
    };
    // Persist to localStorage + DB so category syncs across browsers/devices
    if (type === 'income') {
      addCustomIncomeCategoryDB(name, iconName);
    } else {
      addCustomExpenseCategoryDB(name, iconName);
    }
    setExtraCats(prev => [...prev, newCat]);
    onChange(newCat.name);
    setCustomName('');
    setCustomIcon(Package);
    setAddMode(false);
    setOpen(false);
  }

  const SelIcon = selected?.icon ?? Package;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setAddMode(false); }}
        className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition hover:border-gray-300 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${selected?.bg ?? 'bg-gray-100'}`}>
          <SelIcon className={`h-3.5 w-3.5 ${selected?.color ?? 'text-gray-600'}`} />
        </span>
        <span className="flex-1 text-left font-medium">{selected?.name ?? 'Select…'}</span>
        <ChevronDown className={`h-4 w-4 flex-none text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

          {/* Category grid */}
          <div className="grid grid-cols-2 gap-1 p-2 max-h-56 overflow-y-auto">
            {allCats.map(cat => {
              const Icon = cat.icon;
              const isActive = cat.name === value;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => select(cat)}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                    isActive
                      ? `${cat.bg} ${cat.color} font-semibold ring-1 ring-current/20`
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${cat.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${cat.color}`} />
                  </span>
                  <span className="truncate text-xs font-medium">{cat.name}</span>
                  {isActive && <Check className="ml-auto h-3 w-3 flex-none" />}
                </button>
              );
            })}
          </div>

          {/* Add category section */}
          {allowAdd && !addMode && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={() => setAddMode(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              >
                <Plus className="h-4 w-4" />
                Add category
              </button>
            </div>
          )}

          {/* Inline add form */}
          {addMode && (
            <div className="border-t border-gray-100 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">New category</p>
                <button type="button" onClick={() => setAddMode(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name input */}
              <input
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmCustom()}
                placeholder="Category name…"
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />

              {/* Icon picker — colored icons */}
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">Pick an icon</p>
                <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto pr-0.5">
                  {ICON_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = customIcon === opt.icon;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setCustomIcon(() => opt.icon)}
                        title={opt.name}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400'
                            : `${opt.color} hover:bg-gray-100`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview + confirm */}
              <div className="flex items-center gap-2">
                {customName && (
                  <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {(() => { const I = customIcon; return <I className="h-3 w-3" />; })()}
                    {customName}
                  </div>
                )}
                <button
                  type="button"
                  onClick={confirmCustom}
                  disabled={!customName.trim()}
                  className="ml-auto rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

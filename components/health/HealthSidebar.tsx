'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, LayoutDashboard, ClipboardList, Dumbbell, Settings, Apple, Search, Loader2, X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/Toast';

const menu = [
  { label: 'Dashboard', href: '/orbit/health',          Icon: LayoutDashboard },
  { label: 'Log Today',  href: '/orbit/health/log',      Icon: ClipboardList },
  { label: 'Workouts',  href: '/orbit/health/workouts', Icon: Dumbbell },
];

type FoodResult = {
  name: string;
  servingSize: string;
  servingGrams: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  saturatedFat: number | null;
  sodium: number | null;
  potassium: number | null;
  fiber: number | null;
};

type FoodLog = { id: string; foodName: string; calories: number | null; mealType: string };

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function NutritionRow({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  if (value == null) return null;
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-700">{value}{unit}</span>
    </div>
  );
}

function FoodTracker() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FoodResult[]>([]);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [mealType, setMealType] = useState<typeof MEAL_TYPES[number]>('snack');
  const [logging, setLogging] = useState(false);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const loadTodayLogs = useCallback(async () => {
    if (logsLoaded) return;
    try {
      const r = await fetch(`/api/food-logs?date=${today}`);
      const d = await r.json();
      if (Array.isArray(d)) setTodayLogs(d);
    } catch { /* silent */ }
    setLogsLoaded(true);
  }, [logsLoaded, today]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadTodayLogs();
  };

  const handleSearch = async (q: string) => {
    setQuery(q);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        if (Array.isArray(d)) setResults(d);
        else setResults([]);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 600);
  };

  const handleLog = async () => {
    if (!selected) return;
    setLogging(true);
    try {
      const r = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          foodName: selected.name,
          mealType,
          servingSize: selected.servingSize,
          servingGrams: selected.servingGrams,
          calories: selected.calories,
          protein: selected.protein,
          carbs: selected.carbs,
          fats: selected.fats,
          saturatedFat: selected.saturatedFat,
          sodium: selected.sodium,
          potassium: selected.potassium,
          fiber: selected.fiber,
        }),
      });
      if (!r.ok) throw new Error();
      const log = await r.json();
      toast('Food logged!');
      setTodayLogs(prev => [{ id: log.id, foodName: log.foodName, calories: log.calories, mealType: log.mealType }, ...prev]);
      setSelected(null);
      setResults([]);
      setQuery('');
    } catch {
      toast('Failed to log food', 'error');
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/food-logs/${id}`, { method: 'DELETE' });
      setTodayLogs(prev => prev.filter(l => l.id !== id));
    } catch { /* silent */ }
  };

  const totalCals = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
      >
        <div className="flex items-center gap-2">
          <Apple className="h-4 w-4 text-emerald-500 flex-none" />
          <span>Food</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 px-1">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search food..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-xs focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
            />
            {searching
              ? <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-gray-400" />
              : query
              ? <button onClick={() => { setQuery(''); setResults([]); setSelected(null); }} className="absolute right-2 top-2">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              : <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
            }
          </div>

          {/* Results list */}
          {results.length > 0 && !selected && (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden max-h-40 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { setSelected(r); setResults([]); }}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs text-left hover:bg-emerald-50 border-b border-gray-50 last:border-0 transition"
                >
                  <span className="text-gray-800 font-medium truncate flex-1 pr-2">{r.name}</span>
                  {r.calories != null && <span className="text-emerald-600 font-semibold flex-none">{r.calories} kcal</span>}
                </button>
              ))}
            </div>
          )}

          {/* Selected food nutrition panel */}
          {selected && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold text-gray-900 leading-tight">{selected.name}</p>
                <button onClick={() => setSelected(null)} className="flex-none">
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Per {selected.servingSize}</p>

              {/* Macro summary */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <NutritionRow label="Calories"   value={selected.calories}     unit=" kcal" />
                <NutritionRow label="Protein"    value={selected.protein}      unit="g" />
                <NutritionRow label="Carbs"      value={selected.carbs}        unit="g" />
                <NutritionRow label="Fats"       value={selected.fats}         unit="g" />
                <NutritionRow label="Sat. fat"   value={selected.saturatedFat} unit="g" />
                <NutritionRow label="Fiber"      value={selected.fiber}        unit="g" />
                <NutritionRow label="Sodium"     value={selected.sodium}       unit="mg" />
                <NutritionRow label="Potassium"  value={selected.potassium}    unit="mg" />
              </div>

              {/* Meal type */}
              <div className="flex gap-1 flex-wrap">
                {MEAL_TYPES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium capitalize transition ${mealType === m ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLog}
                disabled={logging}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {logging ? 'Logging...' : 'Log Food'}
              </button>
            </div>
          )}

          {/* Today's food log */}
          {todayLogs.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Today</p>
                <p className="text-[10px] font-semibold text-emerald-600">{Math.round(totalCals)} kcal</p>
              </div>
              {todayLogs.map(l => (
                <div key={l.id} className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-2.5 py-1.5 group">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[11px] font-medium text-gray-800">{l.foodName}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{l.mealType}{l.calories != null ? ` · ${l.calories} kcal` : ''}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="flex-none opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !selected && !searching && query.trim() && (
            <p className="text-center text-[11px] text-gray-400 py-2">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HealthSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const active = useMemo(() => {
    if (!pathname) return '/orbit/health';
    const exact = menu.find(m => m.href === pathname);
    if (exact) return exact.href;
    const prefix = menu.find(m => pathname.startsWith(m.href) && m.href !== '/orbit/health');
    if (prefix) return prefix.href;
    return '/orbit/health';
  }, [pathname]);

  const userName = session?.user?.name ?? 'User';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sticky top-0 hidden h-screen w-56 flex-none flex-col overflow-y-auto border-r border-gray-100 bg-white px-3 py-5 md:flex">
      <div className="mb-5 px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <Heart className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Health</div>
            <div className="text-[11px] text-gray-400">Wellness tracker</div>
          </div>
        </div>
      </div>

      <nav className="space-y-0.5">
        {menu.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 flex-none ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Food Tracker */}
      <FoodTracker />

      <div className="mt-4 border-t border-gray-100" />

      <div className="mt-3 space-y-0.5">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white select-none">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 leading-none">{userName}</p>
            <p className="mt-0.5 truncate text-[11px] text-gray-400">Personal account</p>
          </div>
        </div>

        <Link
          href="/orbit/health/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <Settings className="h-4 w-4 flex-none text-gray-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

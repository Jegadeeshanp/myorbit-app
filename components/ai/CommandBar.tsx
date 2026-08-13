'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, ArrowUp, Loader2, RotateCcw, CheckCircle2, AlertCircle, TrendingUp, Undo2, Paperclip, TrendingDown, Minus } from 'lucide-react';
import { toast } from '@/components/Toast';
import { useDraggableFab } from '@/lib/useDraggableFab';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/lib/financeStore';
// ── Types inlined from @myorbit/api (package not linked in monorepo) ─────────
interface AIMessage    { role: 'user' | 'assistant'; content: string }
interface DailySummary {
  tasks:    { completed: number; pending: number; overdue: number };
  spending: { total: number; topCategories: { category: string; amount: number }[] };
  habits:   { logged: number; total: number; done: string[]; missed: string[] };
}

interface VisionUpdatedAsset { id: string; name: string; oldValue: number; newValue: number }
interface VisionUnmatched    { name: string; value: number; reason: string }
interface VisionParsed       { imageType: string; institution?: string; date?: string; currency: string; entries: { name: string; value: number }[] }
interface ImageScanData      { parsed?: VisionParsed; updated?: VisionUpdatedAsset[]; unmatched?: VisionUnmatched[] }

interface ImageAttachment { base64: string; mimeType: string; previewUrl: string }

// ── Card data types (mirrored from packages/api/ai.ts) ────────────────────────
interface WaterCardData    { amount_ml: number; total_ml: number; goal_ml: number }
interface ActivityCardData { activity_type: string; distance_km: number | null; duration_min: number | null; estimated_kcal: number }
interface NutritionItem    { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number; fibre: number }
interface NutritionCardData { items: NutritionItem[]; totals: { calories: number; protein: number; carbs: number; fat: number; fibre: number } }
interface GoalPlanEntry    { id: string; duration: string; title: string; description: string; milestones: string[]; targetDate: string }
interface GoalPlanCardData { event: string; goals: GoalPlanEntry[] }
type AnyCardData = WaterCardData | ActivityCardData | NutritionCardData | GoalPlanCardData;

// ── Examples ──────────────────────────────────────────────────────────────────

const EXAMPLE_CATEGORIES = [
  {
    label: 'Tasks', color: 'emerald',
    examples: [
      'Add task gym every weekday 6am',
      'Gym done',
      'Snooze dentist to next week',
      'What tasks do I have today?',
      'Show overdue tasks',
      'Change gym to high priority',
      'Mark all overdue done',
    ],
  },
  {
    label: 'Money', color: 'blue',
    examples: [
      '₹500 groceries on HDFC',
      'Transfer ₹2000 from SBI to HDFC',
      '₹5000 rent monthly on Axis',
      'How much did I spend this week?',
      '₹200 Swiggy food',
    ],
  },
  {
    label: 'Habits', color: 'amber',
    examples: [
      'Log meditation done',
      'Add habit drink water daily',
      'Which habits did I log today?',
      'Reading done',
    ],
  },
  {
    label: 'Health', color: 'rose',
    examples: [
      '500ml water',
      'Drank 2 glasses of water',
      'Ran 5km',
      '30 min cycling',
      '2 dosa and 1 cup sambar',
      'Ate banana and coffee',
      'I want to run a marathon',
      'Training for a 10k',
    ],
  },
  {
    label: 'Summary', color: 'purple',
    examples: [
      'Summarize today',
      'How was my day?',
      'Add goal run 5k by March health',
      'Add task + log meditation + ₹200 food',
    ],
  },
] as const;

type Category = typeof EXAMPLE_CATEGORIES[number]['label'];
const ALL_EXAMPLES = EXAMPLE_CATEGORIES.flatMap(c => c.examples);

const TAB_STYLES: Record<string, { active: string; inactive: string }> = {
  Tasks:   { active: 'bg-emerald-50 border-emerald-300 text-emerald-700', inactive: 'border-gray-200 text-gray-500 hover:border-gray-300' },
  Money:   { active: 'bg-blue-50 border-blue-300 text-blue-700',          inactive: 'border-gray-200 text-gray-500 hover:border-gray-300' },
  Habits:  { active: 'bg-amber-50 border-amber-300 text-amber-700',       inactive: 'border-gray-200 text-gray-500 hover:border-gray-300' },
  Health:  { active: 'bg-rose-50 border-rose-300 text-rose-700',          inactive: 'border-gray-200 text-gray-500 hover:border-gray-300' },
  Summary: { active: 'bg-purple-50 border-purple-300 text-purple-700',    inactive: 'border-gray-200 text-gray-500 hover:border-gray-300' },
};

// ── Water card ────────────────────────────────────────────────────────────────

function WaterCard({ data }: { data: WaterCardData }) {
  const pct = Math.min(100, Math.round((data.total_ml / data.goal_ml) * 100));
  return (
    <div className="mt-2 rounded-2xl border border-blue-100 bg-[#F7F7F5] p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">💧</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-blue-800">+{data.amount_ml} ml logged</p>
          <p className="text-[11px] text-blue-500">{data.total_ml} / {data.goal_ml} ml today</p>
        </div>
        <span className="text-xl font-bold text-blue-700">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Activity card ─────────────────────────────────────────────────────────────

function ActivityCard({ data }: { data: ActivityCardData }) {
  return (
    <div className="mt-2 rounded-2xl border border-emerald-100 bg-[#F7F7F5] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏃</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-emerald-800 capitalize">{data.activity_type}</p>
          <div className="flex gap-3 mt-0.5">
            {data.distance_km != null && (
              <span className="text-[11px] text-emerald-600">📍 {data.distance_km} km</span>
            )}
            {data.duration_min != null && (
              <span className="text-[11px] text-emerald-600">⏱ {data.duration_min} min</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold text-emerald-700 leading-none">{data.estimated_kcal}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">kcal burned</p>
        </div>
      </div>
    </div>
  );
}

// ── Nutrition card ────────────────────────────────────────────────────────────

function NutritionCard({ data }: { data: NutritionCardData }) {
  return (
    <div className="mt-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden text-[11px]">
      {/* Header row */}
      <div className="grid grid-cols-6 gap-0 bg-[#F7F7F5] px-3 py-2 border-b border-gray-100 font-semibold text-[10px] uppercase tracking-wide text-gray-400">
        <span className="col-span-2">Food</span>
        <span className="text-right">kcal</span>
        <span className="text-right">P</span>
        <span className="text-right">C</span>
        <span className="text-right">F</span>
      </div>
      {/* Item rows */}
      {data.items.map((item, i) => (
        <div key={i} className="grid grid-cols-6 gap-0 px-3 py-1.5 border-b border-gray-50 text-gray-600">
          <span className="col-span-2 font-medium text-gray-800 truncate pr-1">{item.name}</span>
          <span className="text-right">{Math.round(item.calories)}</span>
          <span className="text-right">{item.protein.toFixed(1)}g</span>
          <span className="text-right">{item.carbs.toFixed(1)}g</span>
          <span className="text-right">{item.fat.toFixed(1)}g</span>
        </div>
      ))}
      {/* Totals row */}
      <div className="grid grid-cols-6 gap-0 px-3 py-2 bg-emerald-50 font-bold text-[11px] text-emerald-800">
        <span className="col-span-2">Total</span>
        <span className="text-right">{Math.round(data.totals.calories)}</span>
        <span className="text-right">{data.totals.protein.toFixed(1)}g</span>
        <span className="text-right">{data.totals.carbs.toFixed(1)}g</span>
        <span className="text-right">{data.totals.fat.toFixed(1)}g</span>
      </div>
    </div>
  );
}

// ── Goal plan card ────────────────────────────────────────────────────────────

const DURATION_LABELS: Record<string, { label: string; color: string }> = {
  '1month': { label: '1 Month',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  '3month': { label: '3 Months', color: 'text-blue-600    bg-blue-50    border-blue-200'    },
  '6month': { label: '6 Months', color: 'text-slate-600   bg-slate-50   border-slate-200'   },
};

function GoalPlanCard({ data }: { data: GoalPlanCardData }) {
  return (
    <div className="mt-2 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Training plan · {data.event}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {data.goals.map(goal => {
          const style = DURATION_LABELS[goal.duration] ?? DURATION_LABELS['1month'];
          return (
            <div key={goal.duration} className={`rounded-2xl border ${style.color} bg-white p-3 shadow-sm`}>
              <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2 ${style.color}`}>
                {style.label}
              </span>
              <p className="text-[11px] font-semibold text-gray-800 leading-snug mb-2">{goal.title}</p>
              <ul className="space-y-1">
                {goal.milestones.slice(0, 4).map((m, i) => (
                  <li key={i} className="flex gap-1 text-[10px] text-gray-500 leading-snug">
                    <span className="mt-px flex-none text-gray-300">·</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-gray-400">by {goal.targetDate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Image vision result card ──────────────────────────────────────────────────

const IMAGE_TYPE_LABELS: Record<string, string> = {
  bank_statement:      '🏦 Bank Statement',
  investment_portfolio:'📈 Investment Portfolio',
  property_valuation:  '🏠 Property Valuation',
  net_worth:           '💼 Net Worth',
  expense_receipt:     '🧾 Expense Receipt',
  unknown:             '📄 Document',
};

function ImageVisionCard({ data, currency }: { data: ImageScanData; currency?: string }) {
  const sym = currency === 'INR' ? '₹' : '$';
  const updated   = data.updated   ?? [];
  const unmatched = data.unmatched ?? [];
  const imageType = data.parsed?.imageType ?? 'unknown';

  return (
    <div className="mt-2 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40">
        <span className="text-sm">{IMAGE_TYPE_LABELS[imageType] ?? '📄 Document'}</span>
        {data.parsed?.institution && (
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">· {data.parsed.institution}</span>
        )}
        {data.parsed?.date && (
          <span className="ml-auto text-[10px] text-gray-400">{data.parsed.date}</span>
        )}
      </div>

      {/* Updated assets */}
      {updated.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            ✓ Updated {updated.length} asset{updated.length > 1 ? 's' : ''}
          </p>
          {updated.map(u => {
            const diff = u.newValue - u.oldValue;
            return (
              <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-[12px] font-medium text-gray-800 dark:text-gray-200 truncate max-w-[50%]">{u.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 line-through">{sym}{u.oldValue.toLocaleString()}</span>
                  <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{sym}{u.newValue.toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {diff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : diff < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                    {sym}{Math.abs(diff).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unmatched items */}
      {unmatched.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
            ⚠ {unmatched.length} unmatched — add assets to auto-update
          </p>
          {unmatched.map((u, i) => (
            <div key={i} className="flex items-center justify-between py-0.5">
              <span className="text-[11px] text-amber-700 dark:text-amber-300 truncate max-w-[60%]">{u.name}</span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">{sym}{u.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Daily summary card ────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: DailySummary }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-100 bg-white overflow-hidden text-sm">
      {/* Tasks row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />
        <span className="font-semibold text-gray-700 flex-1">Tasks</span>
        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{summary.tasks.completed} done</span>
        <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{summary.tasks.pending} pending</span>
        {summary.tasks.overdue > 0 && (
          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">{summary.tasks.overdue} overdue</span>
        )}
      </div>

      {/* Spending row */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-blue-500 flex-none" />
          <span className="font-semibold text-gray-700 flex-1">Spent today</span>
          <span className="font-bold text-gray-900">₹{Math.round(summary.spending.total).toLocaleString('en-IN')}</span>
        </div>
        {summary.spending.topCategories.slice(0, 4).map(c => (
          <div key={c.category} className="flex justify-between text-[11px] text-gray-500 mb-0.5">
            <span>{c.category}</span>
            <span className="font-medium text-gray-700">₹{Math.round(c.amount).toLocaleString('en-IN')}</span>
          </div>
        ))}
        {summary.spending.total === 0 && <p className="text-[11px] text-gray-400">No expenses today 👍</p>}
      </div>

      {/* Habits row */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-none" />
          <span className="font-semibold text-gray-700 flex-1">Habits</span>
          <span className="text-xs font-bold text-amber-600">{summary.habits.logged}/{summary.habits.total}</span>
        </div>
        {summary.habits.done.length > 0 && (
          <p className="text-[11px] text-emerald-600 mb-0.5">✅ {summary.habits.done.join('  ·  ')}</p>
        )}
        {summary.habits.missed.length > 0 && (
          <p className="text-[11px] text-gray-400">⭕ {summary.habits.missed.join('  ·  ')}</p>
        )}
      </div>
    </div>
  );
}

// ── Undo config ───────────────────────────────────────────────────────────────

const UNDO_WINDOW_MS = 60_000;

const UNDO_ACTIONS: Record<string, { label: string; endpoint: (id: string) => string }> = {
  ADD_TASK:        { label: 'task',        endpoint: id => `/api/tasks/${id}` },
  ADD_HABIT:       { label: 'habit',       endpoint: id => `/api/habits/${id}` },
  ADD_GOAL:        { label: 'goal',        endpoint: id => `/api/goals/${id}` },
  ADD_TRANSACTION: { label: 'transaction', endpoint: id => `/api/transactions/${id}` },
};

// ── Chat message type ─────────────────────────────────────────────────────────

type ChatMsg = {
  role:        'user' | 'assistant';
  content:     string;
  ok?:         boolean;
  action?:     string;
  entityId?:   string;
  summary?:    DailySummary;
  cardData?:   AnyCardData;
  imageData?:  ImageScanData;
  currency?:   string;
  thumbUrl?:   string;   // user message: attached image thumbnail
};

// ── Message bubble ────────────────────────────────────────────────────────────

function ChatBubble({ msg, onUndo }: { msg: ChatMsg; onUndo?: (msg: ChatMsg) => void }) {
  const isUser = msg.role === 'user';
  const undoCfg = msg.action ? UNDO_ACTIONS[msg.action] : undefined;
  const canUndo = !!(undoCfg && msg.entityId && msg.ok !== false);

  const [secsLeft, setSecsLeft] = useState<number | null>(canUndo ? Math.floor(UNDO_WINDOW_MS / 1000) : null);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    if (!canUndo || undone) return;
    const start = Date.now();
    const id = setInterval(() => {
      const remaining = Math.ceil((UNDO_WINDOW_MS - (Date.now() - start)) / 1000);
      if (remaining <= 0) { setSecsLeft(null); clearInterval(id); }
      else setSecsLeft(remaining);
    }, 500);
    return () => clearInterval(id);
  }, [canUndo, undone]);

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 mt-0.5">
          <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
        </div>
      )}
      <div className={`${isUser ? 'max-w-[82%]' : 'flex flex-col w-full'}`}>
        <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-emerald-600 text-white'
            : msg.ok === false
              ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/60'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}>
          {msg.content}
        </div>

        {/* AI badge + undo row */}
        {!isUser && msg.ok !== false && canUndo && !undone && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <Sparkles className="h-2.5 w-2.5" /> Created by AI
            </span>
            {secsLeft !== null && onUndo && (
              <button
                onClick={() => { setUndone(true); setSecsLeft(null); onUndo(msg); }}
                className="flex items-center gap-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 transition"
              >
                <Undo2 className="h-2.5 w-2.5" /> Undo <span className="text-gray-400">{secsLeft}s</span>
              </button>
            )}
          </div>
        )}
        {!isUser && undone && (
          <p className="mt-1 px-1 text-[10px] text-gray-400">↩ Undone</p>
        )}

        {/* Image thumbnail (user message) */}
        {msg.thumbUrl && (
          <img src={msg.thumbUrl} alt="Attached" className="mt-1.5 rounded-xl object-cover max-h-32 max-w-48 border border-gray-200 dark:border-gray-600" />
        )}
        {msg.summary && <SummaryCard summary={msg.summary} />}
        {msg.action === 'UPDATE_ASSET' && msg.imageData && <ImageVisionCard data={msg.imageData} currency={msg.currency} />}
        {msg.action === 'WATER'    && msg.cardData && <WaterCard     data={msg.cardData as WaterCardData}     />}
        {msg.action === 'ACTIVITY' && msg.cardData && <ActivityCard  data={msg.cardData as ActivityCardData}  />}
        {msg.action === 'FOOD_LOG' && msg.cardData && <NutritionCard data={msg.cardData as NutritionCardData} />}
        {msg.action === 'GOAL_PLAN'&& msg.cardData && <GoalPlanCard  data={msg.cardData as GoalPlanCardData}  />}
      </div>
    </div>
  );
}

// ── Confirmation panel ────────────────────────────────────────────────────────

const EXPENSE_CATS = ['Food','Groceries','Transport','Restaurants','Shopping','Subscriptions','Utilities','Medical','Travel','Miscellaneous','Insurance','Education','Fuel','Internet','Mobile','Other Expense'];
const INCOME_CATS  = ['Salary','Bonus','Freelance','Business','Dividends','Interest','Rental Income','Cashback','Refund','Other Income'];
const GOAL_CATS    = ['Finance','Health','Career','Learning','Personal','Other'];
const MEAL_TYPES   = ['morning','noon','evening','night'];

function ConfirmationPanel({
  fn, parsedArgs, previewData, accounts, onConfirm, onCancel, loading,
}: {
  fn: string;
  parsedArgs: Record<string, any>;
  previewData?: Record<string, any>;
  accounts: { id: string; name: string; type: string }[];
  onConfirm: (args: Record<string, any>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  // ── Transaction ──
  const [txAmount,  setTxAmount]  = useState(parsedArgs.amount ?? '');
  const [txDesc,    setTxDesc]    = useState(parsedArgs.description ?? '');
  const [txCat,     setTxCat]     = useState(parsedArgs.category ?? 'Miscellaneous');
  const [txType,    setTxType]    = useState<'expense'|'income'>(parsedArgs.type ?? 'expense');
  const [txAccId,   setTxAccId]   = useState(parsedArgs.accountId ?? (accounts[0]?.id ?? ''));

  // ── Water ──
  const [waterMl,   setWaterMl]   = useState(String(previewData?.amount_ml ?? parsedArgs.amount_ml ?? 250));

  // ── Activity ──
  const [actType,   setActType]   = useState(parsedArgs.activity_type ?? '');
  const [actDist,   setActDist]   = useState(parsedArgs.distance_km != null ? String(parsedArgs.distance_km) : '');
  const [actDur,    setActDur]    = useState(parsedArgs.duration_min != null ? String(parsedArgs.duration_min) : '');
  const [actKcal,   setActKcal]   = useState(String(parsedArgs.estimated_kcal ?? 0));

  // ── Food ──
  const [mealType,  setMealType]  = useState<string>(previewData?.mealType ?? parsedArgs.meal_type ?? 'noon');
  const [foodItems, setFoodItems] = useState<NutritionItem[]>(previewData?.items ?? []);
  const foodTotals = foodItems.reduce(
    (acc, item) => ({ calories: acc.calories + item.calories, protein: acc.protein + item.protein, carbs: acc.carbs + item.carbs, fat: acc.fat + item.fat, fibre: acc.fibre + item.fibre }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  );

  // ── Goal ──
  const [goalTitle,    setGoalTitle]    = useState(parsedArgs.title ?? '');
  const [goalCategory, setGoalCategory] = useState(parsedArgs.category ?? 'Personal');
  const [goalDeadline, setGoalDeadline] = useState(parsedArgs.deadline ?? '');
  const [goalWhy,      setGoalWhy]      = useState(parsedArgs.why ?? '');

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none';
  const labelCls = 'text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5 block';

  const handleConfirm = () => {
    if (fn === 'add_transaction') {
      onConfirm({ amount: txAmount, description: txDesc, category: txCat, type: txType, accountId: txAccId || null });
    } else if (fn === 'log_water') {
      onConfirm({ amount_ml: Number(waterMl) });
    } else if (fn === 'log_activity') {
      onConfirm({ activity_type: actType, distance_km: actDist ? Number(actDist) : null, duration_min: actDur ? Number(actDur) : null, estimated_kcal: Number(actKcal) });
    } else if (fn === 'log_food_by_description') {
      onConfirm({ description: parsedArgs.description, preAnalyzed: { items: foodItems, totals: foodTotals, mealType } });
    } else if (fn === 'add_goal') {
      onConfirm({ title: goalTitle, category: goalCategory, deadline: goalDeadline || undefined, why: goalWhy || undefined });
    }
  };

  const ACTION_LABELS: Record<string, string> = {
    add_transaction: 'Confirm Transaction',
    log_water: 'Confirm Water Log',
    log_activity: 'Confirm Activity',
    log_food_by_description: 'Confirm Food Log',
    add_goal: 'Confirm Goal',
  };

  return (
    <div className="border-t border-gray-100 px-4 py-3 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
        ✦ {ACTION_LABELS[fn] ?? 'Confirm'} — review &amp; edit before saving
      </p>

      {fn === 'add_transaction' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Amount (₹)</label>
              <input type="number" value={txAmount} onChange={e => setTxAmount(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['expense','income'] as const).map(t => (
                  <button key={t} onClick={() => setTxType(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold capitalize transition ${txType === t ? (t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white') : 'bg-white text-gray-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input value={txDesc} onChange={e => setTxDesc(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Category</label>
              <select value={txCat} onChange={e => setTxCat(e.target.value)} className={inputCls}>
                {[...(txType === 'income' ? INCOME_CATS : EXPENSE_CATS)].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Account</label>
              <select value={txAccId} onChange={e => setTxAccId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {fn === 'log_water' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Amount (ml)</label>
            <input type="number" value={waterMl} onChange={e => setWaterMl(e.target.value)} className={inputCls} />
          </div>
          {previewData && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
              Today: {previewData.currentMl}ml + {waterMl}ml = <strong>{(previewData.currentMl as number) + (Number(waterMl) || 0)}ml</strong> / {previewData.goal_ml}ml goal
            </div>
          )}
        </div>
      )}

      {fn === 'log_activity' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Activity</label>
            <input value={actType} onChange={e => setActType(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Distance (km)</label>
              <input type="number" value={actDist} onChange={e => setActDist(e.target.value)} placeholder="—" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Duration (min)</label>
              <input type="number" value={actDur} onChange={e => setActDur(e.target.value)} placeholder="—" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Calories (kcal)</label>
              <input type="number" value={actKcal} onChange={e => setActKcal(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {fn === 'log_food_by_description' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Meal</label>
            <select value={mealType} onChange={e => setMealType(e.target.value)} className={inputCls}>
              {MEAL_TYPES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden text-[11px]">
            <div className="grid grid-cols-6 gap-0 bg-gray-50 px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <span className="col-span-2">Food</span><span className="text-right">kcal</span><span className="text-right">P</span><span className="text-right">C</span><span className="text-right">F</span>
            </div>
            {foodItems.map((item, i) => (
              <div key={i} className="grid grid-cols-6 gap-0 px-3 py-1 border-b border-gray-50 text-gray-700">
                <span className="col-span-2 text-gray-800 font-medium truncate">{item.name} <span className="text-gray-400 font-normal">{item.quantity}</span></span>
                <input type="number" value={Math.round(item.calories)} onChange={e => setFoodItems(prev => prev.map((it, j) => j === i ? { ...it, calories: Number(e.target.value) } : it))}
                  className="text-right bg-emerald-50 rounded w-full text-emerald-800 font-medium text-[11px] px-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-300" />
                <span className="text-right">{item.protein.toFixed(1)}g</span>
                <span className="text-right">{item.carbs.toFixed(1)}g</span>
                <span className="text-right">{item.fat.toFixed(1)}g</span>
              </div>
            ))}
            <div className="grid grid-cols-6 gap-0 px-3 py-1.5 bg-emerald-50 font-bold text-[11px] text-emerald-800">
              <span className="col-span-2">Total</span>
              <span className="text-right">{Math.round(foodTotals.calories)}</span>
              <span className="text-right">{foodTotals.protein.toFixed(1)}g</span>
              <span className="text-right">{foodTotals.carbs.toFixed(1)}g</span>
              <span className="text-right">{foodTotals.fat.toFixed(1)}g</span>
            </div>
          </div>
        </div>
      )}

      {fn === 'add_goal' && (
        <div className="space-y-2">
          <div>
            <label className={labelCls}>Title</label>
            <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Category</label>
              <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} className={inputCls}>
                {GOAL_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Deadline (optional)</label>
              <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Why (optional)</label>
            <input value={goalWhy} onChange={e => setGoalWhy(e.target.value)} placeholder="Motivation…" className={inputCls} />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button onClick={handleConfirm} disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandBar() {
  const router     = useRouter();
  const { state: financeState } = useFinance();
  const [open,      setOpen]      = useState(false);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Category>('Tasks');
  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [hintIdx,   setHintIdx]   = useState(0);

  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);

  type PendingConfirmation = { fn: string; parsedArgs: Record<string, any>; previewData?: Record<string, any> };
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const inputRef   = useRef<HTMLInputElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  const { pos, dragging, hasMoved, pointerHandlers } = useDraggableFab(
    'ai-commandbar-position', { right: 24, bottom: 84 },
  );

  // Cycle placeholder when idle
  useEffect(() => {
    if (!open || input) return;
    const id = setInterval(() => setHintIdx(i => (i + 1) % ALL_EXAMPLES.length), 3000);
    return () => clearInterval(id);
  }, [open, input]);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // Scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── File picker handler ────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl = "data:<mimeType>;base64,<data>"
      const [prefix, base64] = dataUrl.split(',');
      const mimeType = prefix.replace('data:', '').replace(';base64', '');
      setImageAttachment({ base64, mimeType, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  }, []);

  const submit = useCallback(async () => {
    const command = input.trim();
    if ((!command && !imageAttachment) || loading) return;

    const thumbUrl = imageAttachment?.previewUrl;

    setMessages(prev => [...prev, {
      role: 'user',
      content: command || '📎 Attached a financial document for scanning',
      thumbUrl,
    }]);
    setInput('');
    const img = imageAttachment;
    setImageAttachment(null);
    setLoading(true);

    try {
      // ── Vision path ──────────────────────────────────────────────────────
      if (img) {
        const res  = await fetch('/api/ai-command/vision', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType, command: command || undefined }),
        });
        if (!res.ok) throw new Error('Could not process the image — please try again.');
        const data = await res.json();
        const imageData = data.data as ImageScanData | undefined;
        const currency  = imageData?.parsed?.currency;

        setMessages(prev => [...prev, {
          role: 'assistant', content: data.message, action: data.action,
          ok: data.success, imageData, currency,
        }]);

        if (data.success) {
          toast('Assets updated from image ✓', 'success');
        } else {
          toast(data.message || 'Could not process image', 'error');
        }
        return;
      }

      // ── Text path ────────────────────────────────────────────────────────
      const history: AIMessage[] = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res  = await fetch('/api/ai-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, history, preview: true }),
      });
      if (!res.ok) throw new Error('Command failed — please try again.');
      const data = await res.json();

      // Confirmation flow: show editable panel before saving
      if (data.pending) {
        setPendingConfirmation({ fn: data.pendingFn, parsedArgs: data.parsedArgs ?? {}, previewData: data.previewData });
        return;
      }

      const summary  = data.data?.summary  as DailySummary | undefined;
      const cardData = data.data?.cardData as AnyCardData  | undefined;
      const action   = data.action         as string       | undefined;
      const entityId = (data.data?.id as string | undefined);

      setMessages(prev => [...prev, {
        role: 'assistant', content: data.message, summary, cardData, action, ok: data.success, entityId,
      }]);

      const HEALTH_ACTIONS = new Set(['WATER', 'FOOD_LOG', 'ACTIVITY']);
      if (data.success && HEALTH_ACTIONS.has(action ?? '')) {
        window.dispatchEvent(new CustomEvent('health:refresh'));
      }

      const CARD_ACTIONS = new Set(['DAILY_SUMMARY', 'QUERY', 'GOAL_PLAN', 'WATER', 'FOOD_LOG', 'ACTIVITY']);
      if (data.success) {
        if (action === 'DAILY_SUMMARY') {
          toast('Opening your daily summary…', 'success');
          setTimeout(() => { setMessages([]); setOpen(false); router.push('/orbit'); }, 800);
        } else if (!CARD_ACTIONS.has(action ?? '')) {
          if (!UNDO_ACTIONS[action ?? '']) {
            toast(data.message, 'success');
            setTimeout(() => { setMessages([]); setOpen(false); }, 2500);
          }
        }
      } else {
        toast(data.message || 'Could not process command', 'error');
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Command failed — check your connection.', ok: false }]);
      toast('Command failed — check your connection', 'error');
    } finally {
      setLoading(false);
    }
  }, [input, imageAttachment, loading, messages]);

  const handleUndo = useCallback(async (msg: ChatMsg) => {
    if (!msg.action || !msg.entityId) return;
    const cfg = UNDO_ACTIONS[msg.action];
    if (!cfg) return;
    try {
      await fetch(cfg.endpoint(msg.entityId), { method: 'DELETE' });
      toast(`↩ ${cfg.label} removed`, 'success');
    } catch {
      toast(`Could not undo — please delete it manually`, 'error');
    }
  }, []);

  const handleConfirm = useCallback(async (editedArgs: Record<string, any>) => {
    if (!pendingConfirmation) return;
    setConfirmLoading(true);
    try {
      const res = await fetch('/api/ai-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedArgs: { fn: pendingConfirmation.fn, args: editedArgs } }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const cardData = data.data?.cardData as AnyCardData | undefined;
      const action   = data.action as string | undefined;
      const entityId = data.data?.id as string | undefined;

      setPendingConfirmation(null);
      setMessages(prev => [...prev, {
        role: 'assistant', content: data.message, cardData, action, ok: data.success, entityId,
      }]);

      const HEALTH_ACTIONS2 = new Set(['WATER', 'FOOD_LOG', 'ACTIVITY']);
      if (data.success && HEALTH_ACTIONS2.has(action ?? '')) {
        window.dispatchEvent(new CustomEvent('health:refresh'));
      }

      const CARD_ACTIONS2 = new Set(['DAILY_SUMMARY', 'QUERY', 'GOAL_PLAN', 'WATER', 'FOOD_LOG', 'ACTIVITY']);
      if (data.success) {
        if (!CARD_ACTIONS2.has(action ?? '') && !UNDO_ACTIONS[action ?? '']) {
          toast(data.message, 'success');
          setTimeout(() => { setMessages([]); setOpen(false); }, 2500);
        }
      } else {
        toast(data.message || 'Could not save', 'error');
      }
    } catch {
      toast('Could not save — please try again', 'error');
    } finally {
      setConfirmLoading(false);
    }
  }, [pendingConfirmation]);

  const handleCancelConfirmation = useCallback(() => {
    setPendingConfirmation(null);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Cancelled.', ok: true }]);
  }, []);

  const fillInput = (text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const currentExamples = EXAMPLE_CATEGORIES.find(c => c.label === activeTab)?.examples ?? [];
  const showHistory     = messages.length > 0;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[58] bg-black/20 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
      )}

      {/* Command panel */}
      <div className={`fixed bottom-20 left-1/2 z-[59] w-full max-w-xl -translate-x-1/2 px-4 transition-all duration-200 ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c2128] shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-950/40 dark:to-transparent">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">AI Command</span>
              <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                {showHistory ? 'Conversation active · typos ok!' : 'just tell me what to do — typos ok!'}
              </span>
            </div>
            {showHistory && (
              <button onClick={() => setMessages([])} title="Clear conversation"
                className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-600 px-2 py-0.5 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <RotateCcw className="h-2.5 w-2.5" /> Clear
              </button>
            )}
            <kbd className="rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-400">⌘K</kbd>
          </div>

          {/* Chat history */}
          {showHistory && (
            <div ref={scrollRef} className="flex flex-col gap-2.5 px-4 py-3 max-h-72 overflow-y-auto border-b border-gray-100 dark:border-gray-700">
              {messages.map((msg, i) => <ChatBubble key={i} msg={msg} onUndo={handleUndo} />)}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 mt-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image preview strip */}
          {imageAttachment && (
            <div className="flex items-center gap-2 px-4 pt-2.5 pb-0">
              <div className="relative inline-block">
                <img
                  src={imageAttachment.previewUrl}
                  alt="Attachment"
                  className="h-16 w-20 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800 shadow-sm"
                />
                <button
                  onClick={() => setImageAttachment(null)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white shadow"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                📎 Financial document attached — I'll scan and update your assets
              </p>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Attach image button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              title="Attach a screenshot or photo (bank statement, portfolio, etc.)"
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg transition ${
                imageAttachment
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
              placeholder={imageAttachment ? 'Optional: add context about this document…' : showHistory ? 'Continue the conversation…' : ALL_EXAMPLES[hintIdx]}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none disabled:opacity-60"
            />
            {input && !loading && (
              <button onClick={() => setInput('')}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => void submit()}
              disabled={(!input.trim() && !imageAttachment) || loading}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          {/* Confirmation panel — shown when AI parsed an action awaiting user review */}
          {pendingConfirmation && (
            <ConfirmationPanel
              fn={pendingConfirmation.fn}
              parsedArgs={pendingConfirmation.parsedArgs}
              previewData={pendingConfirmation.previewData}
              accounts={financeState.accounts}
              onConfirm={handleConfirm}
              onCancel={handleCancelConfirmation}
              loading={confirmLoading}
            />
          )}

          {/* Examples — hidden when conversation is active or confirmation pending */}
          {!showHistory && !pendingConfirmation && (
            <>
              {/* Category tabs */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-4 pt-2 pb-1 flex gap-1.5">
                {EXAMPLE_CATEGORIES.map(cat => (
                  <button key={cat.label}
                    onClick={() => setActiveTab(cat.label as Category)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                      activeTab === cat.label ? TAB_STYLES[cat.label].active : `bg-gray-50 dark:bg-gray-700 ${TAB_STYLES[cat.label].inactive}`
                    }`}
                  >{cat.label}</button>
                ))}
              </div>

              {/* Chips */}
              <div className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5">
                {currentExamples.map(ex => (
                  <button key={ex} onClick={() => fillInput(ex)}
                    className="rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition">
                    {ex}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Draggable FAB */}
      <button {...pointerHandlers}
        onClick={() => { if (!hasMoved.current) setOpen(v => !v); }}
        title="AI Command (⌘K) — drag to move"
        style={{ right: pos.right, bottom: pos.bottom }}
        className={`fixed z-[57] flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-emerald-200/60 transition-colors duration-200 ${
          dragging
            ? 'cursor-grabbing scale-110 bg-emerald-700 text-white'
            : open
              ? 'cursor-grab bg-gray-800 text-white'
              : 'cursor-grab bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'
        }`}
      >
        {open && !dragging ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
    </>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, ArrowUp, Loader2, RotateCcw, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from '@/components/Toast';
import { useDraggableFab } from '@/lib/useDraggableFab';
import type { AIMessage, DailySummary } from '@myorbit/api';

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

// ── Chat message type ─────────────────────────────────────────────────────────

type ChatMsg = {
  role:     'user' | 'assistant';
  content:  string;
  ok?:      boolean;
  action?:  string;
  summary?: DailySummary;
  cardData?: AnyCardData;
};

// ── Message bubble ────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
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
              ? 'bg-red-50 text-red-800 border border-red-100'
              : 'bg-gray-100 text-gray-800'
        }`}>
          {msg.content}
        </div>
        {msg.summary && <SummaryCard summary={msg.summary} />}
        {msg.action === 'WATER'    && msg.cardData && <WaterCard     data={msg.cardData as WaterCardData}     />}
        {msg.action === 'ACTIVITY' && msg.cardData && <ActivityCard  data={msg.cardData as ActivityCardData}  />}
        {msg.action === 'FOOD_LOG' && msg.cardData && <NutritionCard data={msg.cardData as NutritionCardData} />}
        {msg.action === 'GOAL_PLAN'&& msg.cardData && <GoalPlanCard  data={msg.cardData as GoalPlanCardData}  />}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandBar() {
  const [open,      setOpen]      = useState(false);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Category>('Tasks');
  const [messages,  setMessages]  = useState<ChatMsg[]>([]);
  const [hintIdx,   setHintIdx]   = useState(0);

  const inputRef   = useRef<HTMLInputElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  const { pos, dragging, hasMoved, pointerHandlers } = useDraggableFab(
    'ai-commandbar-position', { right: 24, bottom: 24 },
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

  const submit = useCallback(async () => {
    const command = input.trim();
    if (!command || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: command }]);
    setInput('');
    setLoading(true);

    const history: AIMessage[] = messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res  = await fetch('/api/ai-command', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, history }),
      });
      const data = await res.json();
      const summary  = data.data?.summary  as DailySummary | undefined;
      const cardData = data.data?.cardData as AnyCardData  | undefined;
      const action   = data.action         as string       | undefined;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message, summary, cardData, action, ok: data.success }]);

      const CARD_ACTIONS = new Set(['DAILY_SUMMARY', 'QUERY', 'GOAL_PLAN', 'WATER', 'FOOD_LOG', 'ACTIVITY']);
      if (data.success) {
        if (!CARD_ACTIONS.has(action ?? '')) {
          toast(data.message, 'success');
          setTimeout(() => { setMessages([]); setOpen(false); }, 2500);
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
  }, [input, loading, messages]);

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
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 to-white">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 flex-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold text-gray-700">AI Command</span>
              <span className="ml-2 text-[10px] text-gray-400 hidden sm:inline">
                {showHistory ? 'Conversation active · typos ok!' : 'just tell me what to do — typos ok!'}
              </span>
            </div>
            {showHistory && (
              <button onClick={() => setMessages([])} title="Clear conversation"
                className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition">
                <RotateCcw className="h-2.5 w-2.5" /> Clear
              </button>
            )}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">⌘K</kbd>
          </div>

          {/* Chat history */}
          {showHistory && (
            <div ref={scrollRef} className="flex flex-col gap-2.5 px-4 py-3 max-h-72 overflow-y-auto border-b border-gray-100">
              {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
              placeholder={showHistory ? 'Continue the conversation…' : ALL_EXAMPLES[hintIdx]}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none disabled:opacity-60"
            />
            {input && !loading && (
              <button onClick={() => setInput('')}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => void submit()}
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          {/* Examples — hidden when conversation is active */}
          {!showHistory && (
            <>
              {/* Category tabs */}
              <div className="border-t border-gray-100 px-4 pt-2 pb-1 flex gap-1.5">
                {EXAMPLE_CATEGORIES.map(cat => (
                  <button key={cat.label}
                    onClick={() => setActiveTab(cat.label as Category)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                      activeTab === cat.label ? TAB_STYLES[cat.label].active : `bg-gray-50 ${TAB_STYLES[cat.label].inactive}`
                    }`}
                  >{cat.label}</button>
                ))}
              </div>

              {/* Chips */}
              <div className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5">
                {currentExamples.map(ex => (
                  <button key={ex} onClick={() => fillInput(ex)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition">
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

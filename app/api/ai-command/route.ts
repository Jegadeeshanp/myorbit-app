/**
 * /api/ai-command — Intelligent natural-language command & query processor.
 *
 * Features:
 *   • Multi-step  — executes multiple tool calls in one request
 *   • Queries     — read-only tools that answer questions about tasks/spending/habits
 *   • History     — conversation context so "undo that" / "same for tomorrow" works
 *   • Merchant map— auto-categorises Swiggy/Ola/Amazon etc before the model sees it
 *   • Daily summary — structured snapshot: tasks, spending, habits
 *   • Levenshtein fuzzy match for names & typo tolerance in system prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { applyTransactionBalanceDelta } from '@/lib/financeBalance';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import type { RecurringConfig } from '@/lib/financeData';
export const runtime = 'nodejs';

interface DailySummary {
  tasks:    { completed: number; pending: number; overdue: number };
  spending: { total: number; topCategories: { category: string; amount: number }[] };
  habits:   { logged: number; total: number; done: string[]; missed: string[] };
  health?: {
    steps?: number | null; sleepHours?: number | null; waterMl?: number | null;
    mood?: number | null; energyLevel?: number | null;
    workouts: { name: string; durationMins: number; caloriesBurned?: number | null }[];
    totalCalories: number;
  };
  goals?: { active: number; nearDeadline: { title: string; deadline: string }[] };
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Merchant → Category map ───────────────────────────────────────────────────

const MERCHANT_MAP: Record<string, string> = {
  // Food delivery
  swiggy: 'Restaurants', zomato: 'Restaurants', dunzo: 'Restaurants',
  'box8': 'Restaurants', 'faasos': 'Restaurants', 'eat.fit': 'Restaurants',
  // Transport
  ola: 'Transport', uber: 'Transport', rapido: 'Transport', yulu: 'Transport',
  namma: 'Transport', metro: 'Transport', irctc: 'Travel', redbus: 'Travel',
  // Groceries
  bigbasket: 'Groceries', blinkit: 'Groceries', zepto: 'Groceries',
  jiomart: 'Groceries', grofers: 'Groceries', dmart: 'Groceries',
  // Shopping
  amazon: 'Shopping', flipkart: 'Shopping', myntra: 'Shopping',
  meesho: 'Shopping', ajio: 'Shopping', nykaa: 'Shopping', tata: 'Shopping',
  // Subscriptions / Entertainment
  netflix: 'Subscriptions', spotify: 'Subscriptions', hotstar: 'Subscriptions',
  youtube: 'Subscriptions', prime: 'Subscriptions', zee5: 'Subscriptions',
  sonyliv: 'Subscriptions', jiocinema: 'Subscriptions',
  // Fuel
  petrol: 'Fuel', diesel: 'Fuel', hpcl: 'Fuel', iocl: 'Fuel', bpcl: 'Fuel', shell: 'Fuel',
  // Medical
  pharmeasy: 'Medical', apollo: 'Medical', medplus: 'Medical', '1mg': 'Medical',
  // Utilities / Telecom
  bescom: 'Utilities', tneb: 'Utilities', mseb: 'Utilities',
  airtel: 'Mobile', jio: 'Mobile', vi: 'Mobile', bsnl: 'Mobile',
};

function inferCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [key, cat] of Object.entries(MERCHANT_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Rent','Groceries','Restaurants','Fuel','Transport','Utilities','Internet','Mobile',
  'Shopping','Subscriptions','Medical','Insurance','Travel','Education','Gifts',
  'Miscellaneous','Investment','Loan','Food','Salary','Bonus','Freelance',
  'Business','Dividends','Interest','Rental Income','Cashback','Refund','Other Income',
];

const GOAL_CATEGORIES  = ['Finance','Health','Career','Learning','Personal','Other'];
const HABIT_FREQUENCIES = ['daily','weekdays','weekends','weekly','monthly'];

const DAY_INDEX: Record<string, number> = {
  sunday:0, sun:0, monday:1, mon:1, tuesday:2, tue:2, wednesday:3, wed:3,
  thursday:4, thu:4, friday:5, fri:5, saturday:6, sat:6,
};

// ── Fuzzy matching ────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i-1] === b[j-1]
        ? row[j-1]
        : 1 + Math.min(row[j-1], row[j], prev);
      row[j-1] = prev;
      prev = val;
    }
    row[n] = prev;
  }
  return row[n];
}

function fuzzyMatch<T extends { name?: string; title?: string }>(
  items: T[], query: string, maxDist = 5,
): T | undefined {
  if (!items.length || !query) return undefined;
  const q = query.toLowerCase().trim();
  const exact   = items.find(i => (i.name ?? i.title ?? '').toLowerCase() === q);
  if (exact) return exact;
  const sub     = items.find(i => (i.name ?? i.title ?? '').toLowerCase().includes(q));
  if (sub) return sub;
  const words   = q.split(/\s+/).filter(w => w.length >= 3);
  if (words.length) {
    const all = items.find(i => words.every(w  => (i.name ?? i.title ?? '').toLowerCase().includes(w)));
    if (all) return all;
    const any = items.find(i => words.some(w   => (i.name ?? i.title ?? '').toLowerCase().includes(w)));
    if (any) return any;
  }
  let best: T | undefined, bestDist = Infinity;
  for (const item of items) {
    const name = (item.name ?? item.title ?? '').toLowerCase();
    let dist = levenshtein(q, name);
    for (const qw of q.split(/\s+/).filter(w => w.length >= 3))
      for (const iw of name.split(/\s+/))
        dist = Math.min(dist, levenshtein(qw, iw));
    if (dist < bestDist) { bestDist = dist; best = item; }
  }
  return bestDist <= maxDist ? best : undefined;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(Date.now() + 86400000); return d.toISOString().split('T')[0]; }
function nextWeekStr() { const d = new Date(Date.now() + 7 * 86400000); return d.toISOString().split('T')[0]; }
function weekStartStr(){ const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
function monthStartStr(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; }
function nextDateForDow(dow: number): string {
  const d = new Date(); const diff = (dow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff); return d.toISOString().split('T')[0];
}
function fmtAmount(n: number): string {
  return n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${Math.round(n)}`;
}

function detectMealType(description: string): string {
  const lower = description.toLowerCase();
  if (/breakfast|morning|सुबह/.test(lower))  return 'morning';
  if (/lunch|noon|afternoon|दोपहर/.test(lower)) return 'noon';
  if (/dinner|evening|रात का खाना/.test(lower))  return 'evening';
  if (/night|supper|midnight|snack/.test(lower)) return 'night';
  // Fall back to current time of day
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 21) return 'evening';
  return 'night';
}

function repeatToDays(
  repeat: string, repeatOnDays: number[] | undefined, dueDate: string | undefined,
): { isRecurring: boolean; recurrenceDays: number[] | null } {
  switch (repeat) {
    case 'daily':    return { isRecurring: true, recurrenceDays: [0,1,2,3,4,5,6] };
    case 'weekdays': return { isRecurring: true, recurrenceDays: [1,2,3,4,5] };
    case 'weekends': return { isRecurring: true, recurrenceDays: [0,6] };
    case 'weekly': {
      if (repeatOnDays?.length) return { isRecurring: true, recurrenceDays: repeatOnDays };
      const dow = new Date((dueDate ?? todayStr()) + 'T12:00:00').getDay();
      return { isRecurring: true, recurrenceDays: [dow] };
    }
    case 'monthly': case 'yearly':
      return { isRecurring: true, recurrenceDays: null };
    default:
      return { isRecurring: false, recurrenceDays: null };
  }
}

function parseDayNames(input: string[] | number[] | undefined): number[] | undefined {
  if (!input?.length) return undefined;
  const result: number[] = [];
  for (const v of input) {
    if (typeof v === 'number') { if (v >= 0 && v <= 6) result.push(v); continue; }
    const idx = DAY_INDEX[String(v).toLowerCase().trim()];
    if (idx !== undefined) result.push(idx);
  }
  return result.length ? result : undefined;
}

// ── Tool result type ──────────────────────────────────────────────────────────

interface ToolResult {
  success:  boolean;
  action?:  string;
  message:  string;
  data?:    Record<string, unknown>;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  // ── Tasks (write) ───────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'add_task',
      description: 'Create a new task. Use for "add", "create", "remind me", "schedule". Supports recurring + time.',
      parameters: { type: 'object', properties: {
        title:        { type: 'string', description: 'Task title (corrected spelling)' },
        dueDate:      { type: 'string', description: 'Due date YYYY-MM-DD' },
        dueTime:      { type: 'string', description: 'Time HH:MM 24h e.g. "09:00"' },
        priority:     { type: 'string', enum: ['none','low','medium','high'] },
        repeat:       { type: 'string', enum: ['daily','weekdays','weekends','weekly','monthly','yearly'] },
        repeatOnDays: { type: 'array', items: { type: 'string' }, description: 'For weekly: ["monday","wednesday"]' },
      }, required: ['title'] },
    },
  },
  {
    type: 'function', function: {
      name: 'update_task',
      description: 'Update an existing task — rename, reschedule, reprioritise. Use for "change", "update", "move", "reschedule", "edit".',
      parameters: { type: 'object', properties: {
        taskTitle:   { type: 'string', description: 'Current name of the task (partial ok)' },
        newTitle:    { type: 'string', description: 'New title (if renaming)' },
        newDueDate:  { type: 'string', description: 'New due date YYYY-MM-DD' },
        newDueTime:  { type: 'string', description: 'New time HH:MM 24h' },
        newPriority: { type: 'string', enum: ['none','low','medium','high'] },
      }, required: ['taskTitle'] },
    },
  },
  {
    type: 'function', function: {
      name: 'complete_task',
      description: 'Mark one specific task done. Use for "done", "finished", "complete", "check off".',
      parameters: { type: 'object', properties: {
        taskTitle: { type: 'string', description: 'Name or partial name' },
      }, required: ['taskTitle'] },
    },
  },
  {
    type: 'function', function: {
      name: 'complete_all_overdue',
      description: 'Bulk-complete ALL overdue instances. Use for "mark all overdue done", "clear overdue".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function', function: {
      name: 'delete_task',
      description: 'Delete a task. Use for "delete", "remove", "cancel task".',
      parameters: { type: 'object', properties: {
        taskTitle: { type: 'string' },
      }, required: ['taskTitle'] },
    },
  },
  {
    type: 'function', function: {
      name: 'snooze_task',
      description: 'Postpone a task. Use for "snooze", "delay", "push to tomorrow", "move to next week".',
      parameters: { type: 'object', properties: {
        taskTitle: { type: 'string' },
        newDate:   { type: 'string', description: 'YYYY-MM-DD (default: tomorrow)' },
      }, required: ['taskTitle'] },
    },
  },

  // ── Habits (write) ──────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'add_habit',
      description: 'Create a NEW habit. Use for "add habit", "new habit", "track habit", "start habit".',
      parameters: { type: 'object', properties: {
        name:      { type: 'string' },
        frequency: { type: 'string', enum: HABIT_FREQUENCIES, description: 'Default "daily"' },
        color:     { type: 'string', description: 'Hex color (optional)' },
      }, required: ['name'] },
    },
  },
  {
    type: 'function', function: {
      name: 'log_habit',
      description: 'Mark an existing habit done for today. Use for "log", "done", "completed" for a habit.',
      parameters: { type: 'object', properties: {
        habitName: { type: 'string' },
      }, required: ['habitName'] },
    },
  },

  // ── Finance (write) ─────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'add_transaction',
      description: 'Add an expense or income. Can be recurring.',
      parameters: { type: 'object', properties: {
        amount:         { type: 'string', description: 'Positive amount in INR as a number string, e.g. "500" or "1234.50"' },
        description:    { type: 'string', description: 'Short label e.g. "Netflix", "Petrol"' },
        category:       { type: 'string', description: `One of: ${CATEGORIES.join(', ')}` },
        type:           { type: 'string', enum: ['expense','income'] },
        accountId:      { type: 'string', description: 'Exact account ID from ACCOUNTS LIST. Omit if not mentioned.' },
        recurring:      { type: 'string', enum: ['daily','weekly','monthly','yearly','custom'] },
        customInterval: { type: 'string', description: 'e.g. "every 2 weeks"' },
        endAfterTimes:  { type: 'number' },
        endDate:        { type: 'string', description: 'YYYY-MM-DD' },
      }, required: ['amount','description','category','type'] },
    },
  },
  {
    type: 'function', function: {
      name: 'transfer_money',
      description: 'Transfer money between accounts.',
      parameters: { type: 'object', properties: {
        amount:        { type: 'string', description: 'Amount as a number string, e.g. "2000"' },
        fromAccountId: { type: 'string', description: 'Exact ID from ACCOUNTS LIST' },
        toAccountId:   { type: 'string', description: 'Exact ID from ACCOUNTS LIST' },
        description:   { type: 'string' },
      }, required: ['amount','fromAccountId','toAccountId'] },
    },
  },

  // ── Goals (write) ───────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'add_goal',
      description: 'Create a new goal.',
      parameters: { type: 'object', properties: {
        title:    { type: 'string' },
        category: { type: 'string', enum: GOAL_CATEGORIES },
        deadline: { type: 'string', description: 'YYYY-MM-DD (optional)' },
        why:      { type: 'string', description: 'Motivation (optional)' },
      }, required: ['title'] },
    },
  },

  // ── Health — Water ──────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'log_water',
      description: 'Log water intake. Use for "Xml water", "drank X glasses", "X litres water". 1 glass = 250ml, 1 litre = 1000ml.',
      parameters: { type: 'object', properties: {
        amount_ml: { type: 'number', description: 'Amount in ml (normalised). 1 glass=250ml, 1 litre=1000ml.' },
      }, required: ['amount_ml'] },
    },
  },

  // ── Health — Activity ───────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'log_activity',
      description: 'Log a physical activity (walk, run, cycle, swim, etc.). Use for "Xkm walk", "ran Xkm", "X min cycling".',
      parameters: { type: 'object', properties: {
        activity_type:  { type: 'string', description: 'e.g. "walking", "running", "cycling"' },
        distance_km:    { type: 'number', description: 'Distance in km if mentioned, else null' },
        duration_min:   { type: 'number', description: 'Duration in minutes if mentioned, else null' },
        estimated_kcal: { type: 'number', description: 'Estimated kcal burned (MET×70×hours): walk=3.5, run=8, cycle=6' },
      }, required: ['activity_type', 'estimated_kcal'] },
    },
  },

  // ── Health — Food ───────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'log_food_by_description',
      description: 'Log food / calorie intake. Use for "ate X", "had X for lunch", "2 dosa and sambar", "banana and coffee".',
      parameters: { type: 'object', properties: {
        description: { type: 'string', description: 'The raw food description from the user' },
        meal_type:   { type: 'string', enum: ['morning','noon','evening','night'], description: 'Meal slot inferred from user message: morning=breakfast, noon=lunch, evening=dinner, night=late snack. Omit if unclear.' },
      }, required: ['description'] },
    },
  },

  // ── Goals — Fitness Plan ────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'plan_fitness_goal',
      description: 'Generate a structured 1m/3m/6m training plan and create the 3 goals. Use for "want to run a marathon", "training for 10k", "preparing for triathlon".',
      parameters: { type: 'object', properties: {
        event: { type: 'string', description: 'The fitness event/goal, e.g. "marathon", "10k run", "triathlon"' },
      }, required: ['event'] },
    },
  },

  // ── Queries (read) ──────────────────────────────────────────────────────────
  {
    type: 'function', function: {
      name: 'get_daily_summary',
      description: 'Full daily snapshot across all enabled modules: tasks done/pending/overdue, money spent today, habits logged, health metrics (steps/sleep/water/mood/workouts/calories), active goals & near deadlines. Use for "summarize today", "how was my day", "daily report", "what did I do today", "show my day", "summary of the day".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function', function: {
      name: 'query_tasks',
      description: 'List tasks. Use for "what tasks today?", "show overdue", "pending tasks", "upcoming tasks".',
      parameters: { type: 'object', properties: {
        period: { type: 'string', enum: ['today','tomorrow','this_week','overdue'], description: 'Which tasks' },
      }, required: ['period'] },
    },
  },
  {
    type: 'function', function: {
      name: 'query_spending',
      description: 'Read spending data. Use for "how much did I spend?", "show expenses", "weekly spend".',
      parameters: { type: 'object', properties: {
        period: { type: 'string', enum: ['today','this_week','this_month'] },
      }, required: ['period'] },
    },
  },
  {
    type: 'function', function: {
      name: 'query_habits',
      description: 'Habit status for today. Use for "which habits did I log?", "habits pending today", "show habit progress".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeToolCall(
  fn:   string,
  args: Record<string, any>,
  ctx: {
    userId:   string;
    today:    string;
    tomorrow: string;
    nextWeek: string;
    tasks:    { id: string; title: string; dueDate: string | null; priority: string }[];
    habits:   { id: string; name: string }[];
    accounts: { id: string; name: string; type: string }[];
    goals:    { id: string; title: string }[];
  },
): Promise<ToolResult> {
  const { userId, today, tomorrow, nextWeek, tasks, habits, accounts, goals } = ctx;

  // ── ADD TASK ────────────────────────────────────────────────────────────────
  if (fn === 'add_task') {
    const repeat     = args.repeat as string | undefined;
    const parsedDays = parseDayNames(args.repeatOnDays);
    const { isRecurring, recurrenceDays } = repeat
      ? repeatToDays(repeat, parsedDays, args.dueDate)
      : { isRecurring: false, recurrenceDays: null };
    const tags: string[] = [];
    if (repeat) tags.push(`repeat:${repeat}`);
    const task = await prisma.task.create({ data: {
      userId, title: args.title, priority: args.priority ?? 'none',
      dueDate: args.dueDate ?? null, dueTime: args.dueTime ?? null,
      tags: JSON.stringify(tags), status: 'active', isActive: true,
      isRecurring, recurrenceDays: recurrenceDays ?? undefined,
    } });
    const parts = [`✅ Task added: "${task.title}"`];
    if (args.dueDate) parts.push(`due ${args.dueDate === tomorrow ? 'tomorrow' : args.dueDate}`);
    if (args.dueTime) parts.push(`at ${args.dueTime}`);
    if (args.priority && args.priority !== 'none') parts.push(`${args.priority} priority`);
    if (repeat) {
      const dayStr = parsedDays
        ?.map(d => Object.entries(DAY_INDEX).find(([k,v]) => v===d && k.length>3)?.[0] ?? '')
        .filter(Boolean).join(' & ') ?? '';
      parts.push(`repeats ${repeat}${dayStr ? ` (${dayStr})` : ''}`);
    }
    return { success: true, action: 'ADD_TASK', message: parts.join(' · '), data: { id: task.id } };
  }

  // ── UPDATE TASK ─────────────────────────────────────────────────────────────
  if (fn === 'update_task') {
    const match = fuzzyMatch(tasks, args.taskTitle);
    if (!match) return { success: false, message: `Couldn't find a task matching "${args.taskTitle}"` };
    const updates: Record<string,any> = {};
    if (args.newTitle)    updates.title    = args.newTitle;
    if (args.newDueDate)  updates.dueDate  = args.newDueDate;
    if (args.newDueTime)  updates.dueTime  = args.newDueTime;
    if (args.newPriority) updates.priority = args.newPriority;
    if (!Object.keys(updates).length)
      return { success: false, message: 'Nothing to update — specify new title, date, time, or priority' };
    await prisma.task.update({ where: { id: match.id }, data: updates });
    const changeParts = [
      args.newTitle    && `renamed to "${args.newTitle}"`,
      args.newDueDate  && `due → ${args.newDueDate === tomorrow ? 'tomorrow' : args.newDueDate}`,
      args.newDueTime  && `time → ${args.newDueTime}`,
      args.newPriority && `priority → ${args.newPriority}`,
    ].filter(Boolean);
    return { success: true, action: 'UPDATE_TASK', message: `✏️ "${match.title}" — ${changeParts.join(', ')}`, data: { id: match.id } };
  }

  // ── COMPLETE TASK ───────────────────────────────────────────────────────────
  if (fn === 'complete_task') {
    const match = fuzzyMatch(tasks, args.taskTitle);
    if (!match) return { success: false, message: `Couldn't find a task matching "${args.taskTitle}"` };
    const inst = await prisma.taskInstance.findUnique({ where: { taskId_date: { taskId: match.id, date: today } } });
    if (inst) await prisma.taskInstance.update({ where: { id: inst.id }, data: { status: 'completed', completedAt: new Date() } });
    else       await prisma.task.update({ where: { id: match.id }, data: { status: 'completed', completedAt: new Date() } });
    return { success: true, action: 'COMPLETE_TASK', message: `✅ "${match.title}" done!`, data: { id: match.id } };
  }

  // ── COMPLETE ALL OVERDUE ────────────────────────────────────────────────────
  if (fn === 'complete_all_overdue') {
    const result = await prisma.taskInstance.updateMany({
      where: { userId, date: { lt: today }, status: 'pending', isDeleted: false },
      data:  { status: 'completed', completedAt: new Date() },
    });
    return { success: true, action: 'COMPLETE_ALL_OVERDUE', message: `✅ Cleared ${result.count} overdue task${result.count===1?'':'s'}`, data: { count: result.count } };
  }

  // ── DELETE TASK ─────────────────────────────────────────────────────────────
  if (fn === 'delete_task') {
    const match = fuzzyMatch(tasks, args.taskTitle);
    if (!match) return { success: false, message: `Couldn't find task "${args.taskTitle}"` };
    await prisma.task.update({ where: { id: match.id }, data: { isDeleted: true, isActive: false } });
    return { success: true, action: 'DELETE_TASK', message: `🗑️ Deleted "${match.title}"`, data: { id: match.id } };
  }

  // ── SNOOZE TASK ─────────────────────────────────────────────────────────────
  if (fn === 'snooze_task') {
    const match = fuzzyMatch(tasks, args.taskTitle);
    if (!match) return { success: false, message: `Couldn't find task "${args.taskTitle}"` };
    const newDate = args.newDate ?? tomorrow;
    await prisma.task.update({ where: { id: match.id }, data: { dueDate: newDate } });
    const label = newDate===tomorrow?'tomorrow': newDate===nextWeek?'next week': newDate;
    return { success: true, action: 'SNOOZE_TASK', message: `⏰ "${match.title}" snoozed to ${label}`, data: { id: match.id, newDate } };
  }

  // ── ADD HABIT ───────────────────────────────────────────────────────────────
  if (fn === 'add_habit') {
    const COLORS = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
    const color = args.color ?? COLORS[Math.floor(Math.random() * COLORS.length)];
    const freq  = (args.frequency ?? 'daily') as string;
    const daysOfWeek =
      freq === 'weekdays' ? JSON.stringify([1,2,3,4,5]) :
      freq === 'weekends' ? JSON.stringify([6,7])       :
                            JSON.stringify([1,2,3,4,5,6,7]); // daily / weekly / default
    const habit = await prisma.habit.create({ data: { userId, name: args.name, daysOfWeek, color, isActive: true } });
    const freqLabel = freq === 'weekdays' ? 'weekdays' : freq === 'weekends' ? 'weekends' : 'daily';
    return { success: true, action: 'ADD_HABIT', message: `🔥 Habit "${habit.name}" created (${freqLabel})`, data: { id: habit.id } };
  }

  // ── LOG HABIT ───────────────────────────────────────────────────────────────
  if (fn === 'log_habit') {
    const match = fuzzyMatch(habits, args.habitName);
    if (!match) return { success: false, message: `Habit "${args.habitName}" not found. Try "add habit ${args.habitName}" to create it.` };
    await prisma.habitLog.upsert({
      where:  { habitId_logDate: { habitId: match.id, logDate: today } },
      create: { habitId: match.id, userId, logDate: today, value: 1 },
      update: { value: 1 },
    });
    return { success: true, action: 'LOG_HABIT', message: `🔥 "${match.name}" logged for today!`, data: { id: match.id } };
  }

  // ── ADD TRANSACTION ─────────────────────────────────────────────────────────
  if (fn === 'add_transaction') {
    const amount = Math.abs(Number(args.amount));
    if (!amount || isNaN(amount)) return { success: false, message: 'Invalid amount — include a number, e.g. "₹500 groceries"' };
    const autoCategory = inferCategory(args.description);
    const category = CATEGORIES.includes(args.category) ? args.category : (autoCategory ?? 'Miscellaneous');
    const type     = args.type === 'income' ? 'income' : 'expense';
    const accountId: string | null = args.accountId ? (accounts.find(a => a.id === args.accountId)?.id ?? null) : null;
    const row = await prisma.transaction.create({ data: {
      userId, accountId, date: today, category,
      description: args.description, notes: null,
      amount: await encryptNumber(amount), type,
    } });
    if (accountId) await applyTransactionBalanceDelta(userId, { accountId, date: today, amount, type });
    let recurringNote = '';
    if (args.recurring) {
      const cfg: RecurringConfig = {
        frequency: args.recurring, customInterval: args.customInterval ?? undefined,
        startDate: today,
        endType: args.endAfterTimes ? 'after' : args.endDate ? 'on_date' : 'never',
        endAfterTimes: args.endAfterTimes ?? undefined, endDate: args.endDate ?? undefined,
      };
      const nextDate = nextFinanceDate(today, cfg.frequency, cfg.customInterval);
      if (nextDate) {
        await prisma.recurringTransaction.create({ data: {
          userId, accountId: accountId ?? null, category, description: args.description, notes: null,
          amount: await encryptNumber(amount), type, recurringConfig: JSON.stringify(cfg),
          nextDate, occurrenceCount: 1,
        } });
        recurringNote = ` · repeats ${args.recurring}`;
      }
    }
    const sign        = type === 'expense' ? '−' : '+';
    const accountName = accountId ? accounts.find(a => a.id===accountId)?.name : null;
    const msg = `💰 ${sign}${fmtAmount(amount)} · ${args.description} · ${category}${accountName ? ' · '+accountName : ''}${recurringNote}`;
    return { success: true, action: 'ADD_TRANSACTION', message: msg, data: { id: row.id, amount, category, type } };
  }

  // ── TRANSFER MONEY ──────────────────────────────────────────────────────────
  if (fn === 'transfer_money') {
    const amount = Math.abs(Number(args.amount));
    if (!amount || isNaN(amount)) return { success: false, message: 'Invalid transfer amount' };
    const fromAcct = accounts.find(a => a.id === args.fromAccountId);
    const toAcct   = accounts.find(a => a.id === args.toAccountId);
    if (!fromAcct) return { success: false, message: `Source account not found. Accounts: ${accounts.map(a=>a.name).join(', ')}` };
    if (!toAcct)   return { success: false, message: `Destination account not found. Accounts: ${accounts.map(a=>a.name).join(', ')}` };
    if (fromAcct.id === toAcct.id) return { success: false, message: 'Source and destination are the same' };
    const desc = args.description ?? `Transfer to ${toAcct.name}`;
    await prisma.transaction.create({ data: { userId, accountId: fromAcct.id, date: today, category: 'Transfer', description: desc, notes: null, amount: await encryptNumber(amount), type: 'expense' } });
    await applyTransactionBalanceDelta(userId, { accountId: fromAcct.id, date: today, amount, type: 'expense' });
    await prisma.transaction.create({ data: { userId, accountId: toAcct.id, date: today, category: 'Transfer', description: `Transfer from ${fromAcct.name}`, notes: null, amount: await encryptNumber(amount), type: 'income' } });
    await applyTransactionBalanceDelta(userId, { accountId: toAcct.id, date: today, amount, type: 'income' });
    return { success: true, action: 'TRANSFER', message: `🔄 ${fmtAmount(amount)} transferred: ${fromAcct.name} → ${toAcct.name}`, data: { amount, from: fromAcct.name, to: toAcct.name } };
  }

  // ── ADD GOAL ────────────────────────────────────────────────────────────────
  if (fn === 'add_goal') {
    const cat  = GOAL_CATEGORIES.includes(args.category) ? args.category : 'Personal';
    const goal = await prisma.goal.create({ data: { userId, title: args.title, category: cat, why: args.why ?? null, deadline: args.deadline ?? null, status: 'active' } });
    const parts = [`🎯 Goal: "${goal.title}"`];
    if (args.deadline) parts.push(`by ${args.deadline}`);
    if (args.why)      parts.push(args.why);
    return { success: true, action: 'ADD_GOAL', message: parts.join(' · '), data: { id: goal.id } };
  }

  // ── GET DAILY SUMMARY ───────────────────────────────────────────────────────
  if (fn === 'get_daily_summary') {
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
    const enabled = new Set(
      (prefs?.enabledModules ?? 'finance,tasks,habits,goals,health,insights').split(',').map(s => s.trim()),
    );
    const stepsGoal    = prefs?.stepsGoal    ?? 10000;
    const sleepGoal    = prefs?.sleepGoal    ?? 7.5;
    const waterGoal    = prefs?.waterGoal    ?? 2000;
    const caloriesGoal = prefs?.caloriesGoal ?? 2000;

    const [
      instances, overdueCount,
      txns,
      habitLogs, allHabits,
      healthEntry, workouts, foodAgg,
      activeGoalsCount, nearDeadlineGoals,
    ] = await Promise.all([
      // Tasks — always included
      prisma.taskInstance.findMany({
        where:  { userId, date: today, isDeleted: false },
        select: { status: true, task: { select: { title: true } } },
      }),
      prisma.taskInstance.count({
        where: { userId, date: { lt: today }, status: 'pending', isDeleted: false },
      }),
      // Finance
      enabled.has('finance')
        ? prisma.transaction.findMany({ where: { userId, date: today, type: 'expense' }, select: { amount: true, category: true } })
        : Promise.resolve([] as { amount: string; category: string }[]),
      // Habits
      enabled.has('habits')
        ? prisma.habitLog.findMany({ where: { userId, logDate: today }, select: { habitId: true } })
        : Promise.resolve([] as { habitId: string }[]),
      enabled.has('habits')
        ? prisma.habit.findMany({ where: { userId, isActive: true }, select: { id: true, name: true } })
        : Promise.resolve([] as { id: string; name: string }[]),
      // Health
      enabled.has('health')
        ? prisma.healthEntry.findUnique({ where: { userId_date: { userId, date: today } } })
        : Promise.resolve(null),
      enabled.has('health')
        ? prisma.workout.findMany({ where: { userId, date: today }, select: { name: true, durationMins: true, caloriesBurned: true } })
        : Promise.resolve([] as { name: string; durationMins: number; caloriesBurned: number | null }[]),
      enabled.has('health')
        ? prisma.foodLog.aggregate({ where: { userId, date: today }, _sum: { calories: true } })
        : Promise.resolve({ _sum: { calories: null as number | null } }),
      // Goals
      enabled.has('goals')
        ? prisma.goal.count({ where: { userId, status: 'active' } })
        : Promise.resolve(0),
      enabled.has('goals')
        ? prisma.goal.findMany({
            where:   { userId, status: 'active', deadline: { not: null, lte: nextWeekStr() } },
            select:  { title: true, deadline: true },
            take:    3,
          })
        : Promise.resolve([] as { title: string; deadline: string | null }[]),
    ]);

    // Tasks
    const completedTasks = instances.filter(i => i.status === 'completed');
    const pendingTasks   = instances.filter(i => i.status === 'pending');

    // Finance
    const categoryTotals: Record<string, number> = {};
    let totalSpend = 0;
    for (const t of txns) {
      const amt = await decryptNumber(t.amount);
      totalSpend += amt;
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + amt;
    }
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([category, amount]) => ({ category, amount }));

    // Habits
    const loggedIds    = new Set(habitLogs.map(l => l.habitId));
    const doneHabits   = allHabits.filter(h =>  loggedIds.has(h.id)).map(h => h.name);
    const missedHabits = allHabits.filter(h => !loggedIds.has(h.id)).map(h => h.name);

    // Health
    const totalCalories = foodAgg._sum.calories ?? 0;

    // Build output lines
    const d = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    const lines: string[] = [`📊 ${d}`, ''];

    lines.push(
      `📋 Tasks — ✅ ${completedTasks.length} done  📌 ${pendingTasks.length} pending${overdueCount > 0 ? `  ⚠️ ${overdueCount} overdue` : ''}`,
    );

    if (enabled.has('finance')) {
      lines.push(
        totalSpend > 0
          ? `💰 Spent ${fmtAmount(totalSpend)} today${topCategories.length ? '  ·  ' + topCategories.slice(0, 3).map(c => `${c.category} ${fmtAmount(c.amount)}`).join('  ') : ''}`
          : '💰 No expenses today',
      );
    }

    if (enabled.has('habits') && allHabits.length > 0) {
      lines.push(
        `🔥 Habits — ${doneHabits.length}/${allHabits.length} done${doneHabits.length ? '  ✅ ' + doneHabits.join(', ') : ''}${missedHabits.length ? '  ⭕ ' + missedHabits.join(', ') : ''}`,
      );
    }

    if (enabled.has('health')) {
      const hp: string[] = [];
      if (healthEntry?.steps       != null) hp.push(`👟 ${healthEntry.steps.toLocaleString()}/${stepsGoal.toLocaleString()} steps`);
      if (healthEntry?.sleepHours  != null) hp.push(`😴 ${healthEntry.sleepHours}h/${sleepGoal}h sleep`);
      if (healthEntry?.waterMl     != null) hp.push(`💧 ${healthEntry.waterMl}/${waterGoal}ml water`);
      if (healthEntry?.mood        != null) hp.push(`😊 Mood ${healthEntry.mood}/5`);
      if (healthEntry?.energyLevel != null) hp.push(`⚡ Energy ${healthEntry.energyLevel}/10`);
      if (workouts.length > 0) {
        hp.push(`🏋️ ${workouts.map(w => `${w.name} ${w.durationMins}min${w.caloriesBurned ? ` ${w.caloriesBurned}kcal` : ''}`).join(', ')}`);
      }
      if (totalCalories > 0) hp.push(`🍽️ ${Math.round(totalCalories)}/${caloriesGoal}kcal`);
      lines.push(hp.length > 0 ? `🏥 Health — ${hp.join('  ·  ')}` : '🏥 Health — No data logged today');
    }

    if (enabled.has('goals')) {
      if (activeGoalsCount === 0) {
        lines.push('🎯 Goals — No active goals');
      } else {
        const nearParts = nearDeadlineGoals
          .filter((g): g is { title: string; deadline: string } => g.deadline != null)
          .map(g => `"${g.title}" by ${g.deadline}`)
          .join(', ');
        lines.push(`🎯 Goals — ${activeGoalsCount} active${nearParts ? `  ·  Due soon: ${nearParts}` : ''}`);
      }
    }

    const summary: DailySummary = {
      tasks:    { completed: completedTasks.length, pending: pendingTasks.length, overdue: overdueCount },
      spending: { total: totalSpend, topCategories },
      habits:   { logged: doneHabits.length, total: allHabits.length, done: doneHabits, missed: missedHabits },
      health: enabled.has('health') ? {
        steps:         healthEntry?.steps       ?? null,
        sleepHours:    healthEntry?.sleepHours  ?? null,
        waterMl:       healthEntry?.waterMl     ?? null,
        mood:          healthEntry?.mood        ?? null,
        energyLevel:   healthEntry?.energyLevel ?? null,
        workouts:      workouts.map(w => ({ name: w.name, durationMins: w.durationMins, caloriesBurned: w.caloriesBurned })),
        totalCalories,
      } : undefined,
      goals: enabled.has('goals') ? {
        active:       activeGoalsCount,
        nearDeadline: nearDeadlineGoals
          .filter((g): g is { title: string; deadline: string } => g.deadline != null)
          .map(g => ({ title: g.title, deadline: g.deadline })),
      } : undefined,
    };

    return { success: true, action: 'DAILY_SUMMARY', message: lines.join('\n'), data: { summary } };
  }

  // ── QUERY TASKS ─────────────────────────────────────────────────────────────
  if (fn === 'query_tasks') {
    const period = args.period as string;
    if (period === 'overdue') {
      const rows = await prisma.taskInstance.findMany({
        where: { userId, date: { lt: today }, status: 'pending', isDeleted: false },
        include: { task: { select: { title: true } } },
        orderBy: { date: 'desc' }, take: 15,
      });
      if (!rows.length) return { success: true, action: 'QUERY', message: '🎉 No overdue tasks!' };
      return { success: true, action: 'QUERY', message: `⚠️ ${rows.length} overdue:\n${rows.map(r=>`  • ${r.task.title} (${r.date})`).join('\n')}` };
    }
    if (period === 'today') {
      const rows = await prisma.taskInstance.findMany({
        where: { userId, date: today, isDeleted: false },
        include: { task: { select: { title: true } } },
      });
      if (!rows.length) return { success: true, action: 'QUERY', message: '📭 No tasks for today!' };
      const done    = rows.filter(r=>r.status==='completed').map(r=>`  ✅ ${r.task.title}`);
      const pending = rows.filter(r=>r.status!=='completed').map(r=>`  📌 ${r.task.title}`);
      return { success: true, action: 'QUERY', message: `Today's tasks:\n${[...done,...pending].join('\n')}` };
    }
    if (period === 'tomorrow') {
      const rows = await prisma.taskInstance.findMany({
        where: { userId, date: tomorrowStr(), isDeleted: false },
        include: { task: { select: { title: true } } },
      });
      if (!rows.length) return { success: true, action: 'QUERY', message: '📭 Nothing scheduled for tomorrow.' };
      return { success: true, action: 'QUERY', message: `Tomorrow:\n${rows.map(r=>`  📌 ${r.task.title}`).join('\n')}` };
    }
    // this_week
    const end = nextWeekStr();
    const rows = await prisma.task.findMany({
      where: { userId, isDeleted: false, status: 'active', dueDate: { gte: today, lte: end } },
      orderBy: { dueDate: 'asc' }, take: 20,
    });
    if (!rows.length) return { success: true, action: 'QUERY', message: '📭 No tasks this week.' };
    return { success: true, action: 'QUERY', message: `This week:\n${rows.map(r=>`  📌 ${r.title} (${r.dueDate})`).join('\n')}` };
  }

  // ── QUERY SPENDING ──────────────────────────────────────────────────────────
  if (fn === 'query_spending') {
    const period = args.period as string;
    const start  = period==='today' ? today : period==='this_week' ? weekStartStr() : monthStartStr();
    const label  = period==='today' ? 'today' : period==='this_week' ? 'this week' : 'this month';
    const rows = await prisma.transaction.findMany({
      where: { userId, type: 'expense', date: { gte: start, lte: today } },
      select: { amount: true, category: true, description: true },
    });
    if (!rows.length) return { success: true, action: 'QUERY', message: `💰 No expenses ${label}.` };
    const catMap: Record<string,number> = {};
    let total = 0;
    for (const t of rows) {
      const amt = await decryptNumber(t.amount);
      total += amt;
      catMap[t.category] = (catMap[t.category]??0) + amt;
    }
    const cats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const breakdown = cats.map(([c,a])=>`  ${c}: ${fmtAmount(a)}`).join('\n');
    return { success: true, action: 'QUERY', message: `💰 Spent ${fmtAmount(total)} ${label}\n${breakdown}` };
  }

  // ── QUERY HABITS ────────────────────────────────────────────────────────────
  if (fn === 'query_habits') {
    const [allH, logs] = await Promise.all([
      prisma.habit.findMany({ where: { userId, isActive: true }, select: { id: true, name: true } }),
      prisma.habitLog.findMany({ where: { userId, logDate: today }, select: { habitId: true } }),
    ]);
    if (!allH.length) return { success: true, action: 'QUERY', message: '📭 No habits set up yet.' };
    const loggedIds = new Set(logs.map(l=>l.habitId));
    const done   = allH.filter(h=> loggedIds.has(h.id)).map(h=>`  ✅ ${h.name}`);
    const missed = allH.filter(h=>!loggedIds.has(h.id)).map(h=>`  ⭕ ${h.name}`);
    return { success: true, action: 'QUERY', message: `🔥 Habits today (${done.length}/${allH.length}):\n${[...done,...missed].join('\n')}` };
  }

  // ── LOG WATER ───────────────────────────────────────────────────────────────
  if (fn === 'log_water') {
    const amount_ml = Math.round(Math.abs(Number(args.amount_ml)));
    if (!amount_ml || isNaN(amount_ml)) return { success: false, message: 'Invalid water amount' };

    const prefs    = await prisma.userPreferences.findUnique({ where: { userId } });
    const goal_ml  = prefs?.waterGoal ?? 2000;
    const existing = await prisma.healthEntry.findUnique({ where: { userId_date: { userId, date: today } } });
    const total_ml = (existing?.waterMl ?? 0) + amount_ml;

    await prisma.healthEntry.upsert({
      where:  { userId_date: { userId, date: today } },
      create: { userId, date: today, waterMl: total_ml },
      update: { waterMl: total_ml },
    });

    const pct = Math.min(100, Math.round((total_ml / goal_ml) * 100));
    return {
      success: true, action: 'WATER',
      message: `💧 +${amount_ml}ml logged — ${total_ml}/${goal_ml}ml (${pct}%) today`,
      data: { cardData: { amount_ml, total_ml, goal_ml } },
    };
  }

  // ── LOG ACTIVITY ─────────────────────────────────────────────────────────────
  if (fn === 'log_activity') {
    const activity_type  = String(args.activity_type ?? 'Activity');
    const distance_km    = args.distance_km != null ? Number(args.distance_km)  : null;
    const duration_min   = args.duration_min != null ? Math.round(Number(args.duration_min)) : null;
    const estimated_kcal = Math.round(Math.abs(Number(args.estimated_kcal)));

    // Use undefined (not null) for optional fields so Prisma omits them from
    // the INSERT when the column may not yet exist in the production DB.
    await prisma.workout.create({ data: {
      userId,
      name:           activity_type,
      type:           'other',
      durationMins:   duration_min ?? 30,
      ...(estimated_kcal > 0 ? { caloriesBurned: estimated_kcal } : {}),
      ...(distance_km   != null ? { distanceKm: distance_km }     : {}),
      date:           today,
    } });

    const parts: string[] = [activity_type];
    if (distance_km)  parts.push(`${distance_km}km`);
    if (duration_min) parts.push(`${duration_min}min`);
    parts.push(`${estimated_kcal} kcal`);
    return {
      success: true, action: 'ACTIVITY',
      message: `🏃 ${parts.join(' · ')} burned`,
      data: { cardData: { activity_type, distance_km, duration_min, estimated_kcal } },
    };
  }

  // ── LOG FOOD ─────────────────────────────────────────────────────────────────
  if (fn === 'log_food_by_description') {
    const description = String(args.description ?? '').trim();
    if (!description) return { success: false, message: 'Food description is required' };

    const nutritionCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content:
        `Analyze nutritional content for this Indian meal: "${description}"\n` +
        `Use Indian portion sizes and common Indian foods. Return ONLY valid JSON, no markdown:\n` +
        `{"items":[{"name":string,"quantity":string,"calories":number,"protein":number,"carbs":number,"fat":number,"fibre":number}],` +
        `"totals":{"calories":number,"protein":number,"carbs":number,"fat":number,"fibre":number}}`,
      }],
      max_tokens:  600,
      temperature: 0.1,
    });

    const raw       = nutritionCompletion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, message: 'Could not analyse food — please try rephrasing' };

    const nutrition = JSON.parse(jsonMatch[0]) as {
      items:  { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number; fibre: number }[];
      totals: { calories: number; protein: number; carbs: number; fat: number; fibre: number };
    };

    // Determine meal slot: LLM-detected > description keywords > time of day
    const mealType = (args.meal_type as string | undefined) ?? detectMealType(description);

    await Promise.all(nutrition.items.map(item =>
      prisma.foodEntry.create({ data: {
        userId, date: today,
        name:      `${item.name} (${item.quantity})`,
        mealType,
        calories:  item.calories,
        proteinG:  item.protein,
        carbsG:    item.carbs,
        fatG:      item.fat,
        fiberG:    item.fibre,
      } }),
    ));

    return {
      success: true, action: 'FOOD_LOG',
      message: `🍽️ Logged ${nutrition.items.length} items — ${Math.round(nutrition.totals.calories)} kcal`,
      data: { cardData: { items: nutrition.items, totals: nutrition.totals } },
    };
  }

  // ── PLAN FITNESS GOAL ────────────────────────────────────────────────────────
  if (fn === 'plan_fitness_goal') {
    const event = String(args.event ?? '').trim();
    if (!event) return { success: false, message: 'Fitness event is required' };

    const addMonths = (n: number) => {
      const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString().split('T')[0];
    };

    const planCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content:
        `Generate a structured fitness training plan for "${event}" with exactly 3 goals.\n` +
        `Today: ${today}. Target dates: 1-month=${addMonths(1)}, 3-month=${addMonths(3)}, 6-month=${addMonths(6)}.\n` +
        `Return ONLY valid JSON, no markdown:\n` +
        `{"event":"${event}","goals":[` +
        `{"duration":"1month","title":string,"description":string,"milestones":["week1 goal","week2 goal","week3 goal","week4 goal"],"targetDate":"${addMonths(1)}"},` +
        `{"duration":"3month","title":string,"description":string,"milestones":["month1 goal","month2 goal","month3 goal"],"targetDate":"${addMonths(3)}"},` +
        `{"duration":"6month","title":string,"description":string,"milestones":["month2 goal","month3 goal","month4 goal","month6 goal"],"targetDate":"${addMonths(6)}"}` +
        `]}`,
      }],
      max_tokens:  800,
      temperature: 0.3,
    });

    const raw       = planCompletion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, message: 'Could not generate goal plan — try again' };

    const plan  = JSON.parse(jsonMatch[0]) as {
      event: string;
      goals: { duration: string; title: string; description: string; milestones: string[]; targetDate: string }[];
    };

    const horizonMap: Record<string, string> = { '1month': '1m', '3month': '3m', '6month': '6m' };

    const created = await Promise.all(plan.goals.map(g =>
      prisma.goal.create({ data: {
        userId, title: g.title, category: 'Health',
        why: g.description, deadline: g.targetDate, status: 'active',
        milestones: { create: g.milestones.map(m => ({ userId, title: m, horizon: horizonMap[g.duration] ?? '1m' })) },
      }, include: { milestones: true } }),
    ));

    const cardGoals = plan.goals.map((g, i) => ({
      id:          created[i].id,
      duration:    g.duration,
      title:       g.title,
      description: g.description,
      milestones:  g.milestones,
      targetDate:  g.targetDate,
    }));

    return {
      success: true, action: 'GOAL_PLAN',
      message: `🎯 Created 3 training goals for ${event}`,
      data: { cardData: { event, goals: cardGoals } },
    };
  }

  return { success: false, message: 'Unknown action — please rephrase' };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { command, history = [] } = await req.json() as { command: string; history?: { role: string; content: string }[] };
    if (!command?.trim()) return NextResponse.json({ error: 'No command provided' }, { status: 400 });

    const today    = todayStr();
    const tomorrow = tomorrowStr();
    const nextWeek = nextWeekStr();

    const [tasks, habits, accounts, goals] = await Promise.all([
      prisma.task.findMany({
        where:   { userId, isDeleted: false, status: 'active', isActive: true },
        select:  { id: true, title: true, dueDate: true, priority: true },
        orderBy: { createdAt: 'desc' }, take: 60,
      }),
      prisma.habit.findMany({ where: { userId, isActive: true }, select: { id: true, name: true } }),
      prisma.account.findMany({ where: { userId }, select: { id: true, name: true, type: true } }),
      prisma.goal.findMany({ where: { userId, status: 'active' }, select: { id: true, title: true }, take: 20 }),
    ]);

    const accountList = accounts.length
      ? accounts.map(a => `  • "${a.name}" (${a.type}) → id: ${a.id}`).join('\n')
      : '  (no accounts yet)';

    const systemPrompt = `You are a smart, forgiving AI assistant for MyOrbit — a personal productivity app (Indian user, INR).
Today: ${today}. Tomorrow: ${tomorrow}. Next week: ${nextWeek}.

━━ TYPO & SHORTHAND TOLERANCE ━━
Users type fast with errors. Always infer intent:
• "tatsk/tsk" → task  • "habt/hbt" → habit  • "expnse/xpns" → expense
• "trnsfr" → transfer  • "groci" → groceries  • "tml/tmrw" → tomorrow
• "gym done" → complete_task gym  • "500 food" → add_transaction 500 food expense
• Correct spelling in all titles/descriptions before returning.

━━ MULTI-STEP ━━
You CAN call multiple functions in one response when the user asks to do several things.
E.g. "add gym task and log meditation" → call add_task AND log_habit together.

━━ ACCOUNTS ━━
${accountList}

━━ USER DATA ━━
Tasks:  ${tasks.map(t=>t.title).join(' | ') || 'none'}
Habits: ${habits.map(h=>h.name).join(' | ') || 'none'}
Goals:  ${goals.map(g=>g.title).join(' | ') || 'none'}

━━ RULES ━━
1. For queries ("what tasks today?", "how much spent?", "summarize my day") → use query tools.
2. "done X" / "X done" → complete_task X (check tasks) OR log_habit X (check habits).
3. Merchant names auto-map categories (Swiggy→Restaurants, Ola→Transport, etc.) — still provide best guess.
4. For account IDs use exact id from ACCOUNTS. Omit if no account mentioned.
5. Natural times → HH:MM 24h. Natural dates → YYYY-MM-DD.
6. Correct obvious typos in titles before returning them.
7. Water intake ("Xml water", "drank X glasses", "X litres") → log_water. 1 glass=250ml, 1 litre=1000ml.
8. Physical activity ("Xkm walk", "ran Xkm", "Xmin cycling") → log_activity. MET kcal: walk=3.5×70×hrs, run=8×70×hrs, cycle=6×70×hrs.
9. Food/meals ("ate X", "had X for lunch", "2 dosa and sambar") → log_food_by_description. Set meal_type: morning/noon/evening/night based on user words or time of day.
10. Fitness events ("want to run marathon", "training for 10k", "preparing for triathlon") → plan_fitness_goal.`;

    // Build messages with conversation history (last 6 turns max)
    const recentHistory = history.slice(-6).map(m => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model:    'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentHistory,
        { role: 'user',   content: command.trim() },
      ],
      tools:       TOOLS,
      tool_choice: 'auto',
      max_tokens:  1000,
      temperature: 0.05,
    });

    const toolCalls = completion.choices[0]?.message?.tool_calls ?? [];
    if (!toolCalls.length) {
      return NextResponse.json({
        success: false,
        message: "I didn't catch that. Try:\n• \"Add task buy milk tomorrow\"\n• \"₹500 groceries on HDFC\"\n• \"Log meditation done\"\n• \"Summarize today\"",
      });
    }

    // Execute all tool calls (multi-step support)
    const ctx = { userId, today, tomorrow, nextWeek, tasks, habits, accounts, goals };
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      const fn = call.function.name;
      let args: Record<string, any>;
      try {
        args = JSON.parse(call.function.arguments) as Record<string, any>;
      } catch {
        return NextResponse.json({ success: false, message: 'Could not parse that command — please try again.' });
      }
      const res  = await executeToolCall(fn, args, ctx);
      results.push(res);
      if (!res.success) {
        // Return the first failure immediately
        return NextResponse.json(res);
      }
    }

    // Aggregate all results
    const combinedMessage = results.map(r => r.message).join('\n');
    const lastResult      = results[results.length - 1];

    return NextResponse.json({
      success: true,
      action:  results.length > 1 ? 'MULTI' : lastResult.action,
      message: combinedMessage,
      data:    lastResult.data,
    });

  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[ai-command]', e);
    return NextResponse.json({ error: 'Command failed', message: 'Something went wrong — please try rephrasing your command.' }, { status: 500 });
  }
}

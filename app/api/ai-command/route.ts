/**
 * /api/ai-command — Natural language command processor (Groq llama-3.3-70b-versatile).
 *
 * Tools:
 *   add_task              — create a task, optionally recurring with time
 *   complete_task         — mark a task done by fuzzy name
 *   add_transaction       — expense or income, optionally recurring
 *   transfer_money        — move money between two accounts (two-leg transaction)
 *   log_habit             — log a habit for today
 *   add_goal              — create a new goal
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber } from '@/lib/encryption';
import { applyTransactionBalanceDelta } from '@/lib/financeBalance';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import type { RecurringConfig } from '@/lib/financeData';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Rent','Groceries','Restaurants','Fuel','Transport','Utilities','Internet','Mobile',
  'Shopping','Subscriptions','Medical','Insurance','Travel','Education','Gifts',
  'Miscellaneous','Investment','Loan','Food','Salary','Bonus','Freelance',
  'Business','Dividends','Interest','Rental Income','Cashback','Refund','Other Income',
];

const GOAL_CATEGORIES = ['Finance','Health','Career','Learning','Personal','Other'];

// Day name → index mapping (0=Sunday … 6=Saturday)
const DAY_INDEX: Record<string, number> = {
  sunday:0, sun:0, monday:1, mon:1, tuesday:2, tue:2, wednesday:3, wed:3,
  thursday:4, thu:4, friday:5, fri:5, saturday:6, sat:6,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d=new Date(Date.now()+86400000); return d.toISOString().split('T')[0]; }
function nextWeekStr() { const d=new Date(Date.now()+7*86400000); return d.toISOString().split('T')[0]; }

function fuzzyMatch<T extends { name?: string; title?: string }>(
  items: T[], query: string,
): T | undefined {
  const q = query.toLowerCase().trim();
  return (
    items.find(i => (i.name??i.title??'').toLowerCase() === q) ??
    items.find(i => (i.name??i.title??'').toLowerCase().includes(q)) ??
    items.find(i => q.split(' ').some(w => w.length > 2 && (i.name??i.title??'').toLowerCase().includes(w)))
  );
}

/** Convert a repeat string to recurrenceDays int[] for the Task model. */
function repeatToDays(
  repeat: string,
  repeatOnDays: number[] | undefined,
  dueDate: string | undefined,
): { isRecurring: boolean; recurrenceDays: number[] | null } {
  switch (repeat) {
    case 'daily':    return { isRecurring: true, recurrenceDays: [0,1,2,3,4,5,6] };
    case 'weekdays': return { isRecurring: true, recurrenceDays: [1,2,3,4,5] };
    case 'weekends': return { isRecurring: true, recurrenceDays: [0,6] };
    case 'weekly': {
      if (repeatOnDays?.length) return { isRecurring: true, recurrenceDays: repeatOnDays };
      // fall back to the day of dueDate (or today)
      const dateStr = dueDate ?? todayStr();
      const dow = new Date(dateStr + 'T12:00:00').getDay();
      return { isRecurring: true, recurrenceDays: [dow] };
    }
    case 'monthly':
    case 'yearly':
      return { isRecurring: true, recurrenceDays: null };
    default:
      return { isRecurring: false, recurrenceDays: null };
  }
}

/** Parse day names like "monday", "mon", "1" to day index 0-6. */
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

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  // ── Tasks ──────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'Create a new task. Supports one-off and recurring tasks with a specific time.',
      parameters: {
        type: 'object',
        properties: {
          title:        { type: 'string', description: 'Task title' },
          dueDate:      { type: 'string', description: 'Due date YYYY-MM-DD (optional for recurring)' },
          dueTime:      { type: 'string', description: 'Time in HH:MM 24h format, e.g. "09:00", "21:30"' },
          priority:     { type: 'string', enum: ['none','low','medium','high'] },
          repeat:       {
            type: 'string',
            enum: ['daily','weekdays','weekends','weekly','monthly','yearly'],
            description: 'Repeat pattern. Use "weekly" for specific days of week.',
          },
          repeatOnDays: {
            type: 'array',
            items: { type: 'string' },
            description: 'For weekly repeat: day names or numbers (0=Sun…6=Sat). e.g. ["monday","wednesday"] or ["1","3"]. Can specify multiple days.',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_task',
      description: 'Mark an existing task as completed',
      parameters: {
        type: 'object',
        properties: {
          taskTitle: { type: 'string', description: 'Name or partial name of the task' },
        },
        required: ['taskTitle'],
      },
    },
  },

  // ── Finance ────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Add an expense or income transaction. Can be one-off or recurring.',
      parameters: {
        type: 'object',
        properties: {
          amount:         { type: 'number', description: 'Positive amount in INR' },
          description:    { type: 'string', description: 'Short label, e.g. "Netflix", "Petrol"' },
          category:       { type: 'string', description: `One of: ${CATEGORIES.join(', ')}` },
          type:           { type: 'string', enum: ['expense','income'] },
          accountId:      { type: 'string', description: 'Exact account ID from the ACCOUNTS LIST in your context. Use null if no account mentioned.' },
          recurring:      {
            type: 'string',
            enum: ['daily','weekly','monthly','yearly','custom'],
            description: 'Make this a recurring transaction.',
          },
          customInterval: { type: 'string', description: 'For recurring=custom: e.g. "every 2 weeks", "every 3 months"' },
          endAfterTimes:  { type: 'number', description: 'Stop recurring after N occurrences (optional)' },
          endDate:        { type: 'string', description: 'Stop recurring on YYYY-MM-DD (optional)' },
        },
        required: ['amount','description','category','type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transfer_money',
      description: 'Transfer money from one account to another (creates debit + credit pair)',
      parameters: {
        type: 'object',
        properties: {
          amount:        { type: 'number', description: 'Amount to transfer in INR' },
          fromAccountId: { type: 'string', description: 'Exact ID of source account from the ACCOUNTS LIST' },
          toAccountId:   { type: 'string', description: 'Exact ID of destination account from the ACCOUNTS LIST' },
          description:   { type: 'string', description: 'Transfer note (optional)' },
        },
        required: ['amount','fromAccountId','toAccountId'],
      },
    },
  },

  // ── Habits & Goals ─────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'log_habit',
      description: 'Mark a habit as done for today',
      parameters: {
        type: 'object',
        properties: {
          habitName: { type: 'string' },
        },
        required: ['habitName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_goal',
      description: 'Create a new goal',
      parameters: {
        type: 'object',
        properties: {
          title:    { type: 'string' },
          category: { type: 'string', enum: GOAL_CATEGORIES },
          deadline: { type: 'string', description: 'YYYY-MM-DD (optional)' },
          why:      { type: 'string', description: 'Motivation / reason (optional)' },
        },
        required: ['title'],
      },
    },
  },
];

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const userId  = await requireUserId();
    const { command } = await req.json() as { command: string };
    if (!command?.trim()) return NextResponse.json({ error: 'No command provided' }, { status: 400 });

    const today    = todayStr();
    const tomorrow = tomorrowStr();
    const nextWeek = nextWeekStr();

    // Fetch user context so the model can match real names
    const [tasks, habits, accounts] = await Promise.all([
      prisma.task.findMany({
        where: { userId, isDeleted: false, status: 'active', isActive: true },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, name: true },
      }),
      prisma.account.findMany({
        where: { userId },
        select: { id: true, name: true, type: true },
      }),
    ]);

    // Build a numbered account list Groq can reference by ID
    const accountList = accounts.length
      ? accounts.map(a => `  • "${a.name}" (${a.type}) → id: ${a.id}`).join('\n')
      : '  (no accounts yet)';

    const systemPrompt = `You are a command interpreter for MyOrbit, a personal productivity app (Indian user, currency INR).
Today is ${today}. Tomorrow is ${tomorrow}. Next week starts ${nextWeek}.

ACCOUNTS LIST (use the exact id value when calling add_transaction or transfer_money):
${accountList}

Active tasks: ${tasks.map(t => t.title).join(' | ') || 'none'}
Habits:       ${habits.map(h => h.name).join(' | ') || 'none'}

Rules:
- For accountId / fromAccountId / toAccountId: read the ACCOUNTS LIST above and return the EXACT id string that matches what the user said. If the user says "Axis savings", pick the Savings Account entry. If "Regalia", pick the Regalia credit card. Never guess — only use IDs from the list above.
- If no account is mentioned, omit accountId (leave it out, do not set it to null or "").
- Convert all natural date/time to YYYY-MM-DD and HH:MM 24h.
- Recurring tasks: repeat="weekly" + repeatOnDays=["monday"] for "every Monday". Multiple days: ["monday","wednesday"].
  "Every weekday"→repeat="weekdays". "Every day"→repeat="daily".
- For "first Monday"/"last Sunday": use repeat="weekly" on that day (nth-weekday-of-month not yet supported).
- Recurring transactions: set the recurring field to the frequency.
- Call exactly one function.`;

    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: command.trim() },
      ],
      tools:       TOOLS,
      tool_choice: 'auto',
      max_tokens:  600,
      temperature: 0.1,
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return NextResponse.json({
        success: false,
        message: "I couldn't understand that. Try: \"Add task call dentist tomorrow 10am weekly every Monday\", \"Add ₹500 food on HDFC monthly\", \"Transfer ₹2000 from SBI to HDFC\"",
      });
    }

    const fn   = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments) as Record<string, any>;

    // ── ADD TASK ──────────────────────────────────────────────────────────────
    if (fn === 'add_task') {
      const repeat     = args.repeat as string | undefined;
      const parsedDays = parseDayNames(args.repeatOnDays);
      const { isRecurring, recurrenceDays } = repeat
        ? repeatToDays(repeat, parsedDays, args.dueDate)
        : { isRecurring: false, recurrenceDays: null };

      const tags: string[] = [];
      if (repeat) tags.push(`repeat:${repeat}`);

      const task = await prisma.task.create({
        data: {
          userId,
          title:         args.title,
          priority:      args.priority ?? 'none',
          dueDate:       args.dueDate ?? null,
          dueTime:       args.dueTime ?? null,
          tags:          JSON.stringify(tags),
          status:        'active',
          isActive:      true,
          isRecurring,
          recurrenceDays: recurrenceDays ?? undefined,
        },
      });

      const parts: string[] = [`✅ Created task "${task.title}"`];
      if (args.dueDate) parts.push(`due ${args.dueDate}`);
      if (args.dueTime) parts.push(`at ${args.dueTime}`);
      if (repeat) {
        const dayStr = parsedDays?.map(d => Object.keys(DAY_INDEX).find(k => DAY_INDEX[k] === d && k.length > 3)).filter(Boolean).join(' & ') ?? '';
        parts.push(`repeating ${repeat}${dayStr ? ` (${dayStr})` : ''}`);
      }
      return NextResponse.json({ success: true, action: 'ADD_TASK', message: parts.join(' · '), data: { id: task.id } });
    }

    // ── COMPLETE TASK ─────────────────────────────────────────────────────────
    if (fn === 'complete_task') {
      const match = fuzzyMatch(tasks, args.taskTitle);
      if (!match) return NextResponse.json({ success: false, message: `Couldn't find a task matching "${args.taskTitle}"` });
      await prisma.task.update({ where: { id: match.id }, data: { status: 'completed', completedAt: new Date() } });
      return NextResponse.json({ success: true, action: 'COMPLETE_TASK', message: `✅ Completed "${match.title}"`, data: { id: match.id } });
    }

    // ── ADD TRANSACTION ───────────────────────────────────────────────────────
    if (fn === 'add_transaction') {
      const amount = Math.abs(Number(args.amount));
      if (!amount || isNaN(amount)) return NextResponse.json({ success: false, message: 'Invalid amount' });

      // Groq returns the exact ID from the system prompt — validate it belongs to this user
      const accountId: string | null = args.accountId
        ? (accounts.find(a => a.id === args.accountId)?.id ?? null)
        : null;

      const category = CATEGORIES.includes(args.category) ? args.category : 'Miscellaneous';
      const type     = args.type === 'income' ? 'income' : 'expense';

      const row = await prisma.transaction.create({
        data: {
          userId,
          accountId,
          date:        today,
          category,
          description: args.description,
          notes:       null,
          amount:      await encryptNumber(amount),
          type,
        },
      });

      if (accountId) {
        await applyTransactionBalanceDelta(userId, { accountId, date: today, amount, type });
      }

      // Set up recurring template if requested
      let recurringNote = '';
      if (args.recurring) {
        const cfg: RecurringConfig = {
          frequency:      args.recurring,
          customInterval: args.customInterval ?? undefined,
          startDate:      today,
          endType:        args.endAfterTimes ? 'after' : args.endDate ? 'on_date' : 'never',
          endAfterTimes:  args.endAfterTimes ?? undefined,
          endDate:        args.endDate ?? undefined,
        };
        const nextDate = nextFinanceDate(today, cfg.frequency, cfg.customInterval);
        if (nextDate) {
          await prisma.recurringTransaction.create({
            data: {
              userId,
              accountId: accountId ?? null,
              category,
              description: args.description,
              notes:       null,
              amount:      await encryptNumber(amount),
              type,
              recurringConfig: JSON.stringify(cfg),
              nextDate,
              occurrenceCount: 1,
            },
          });
          recurringNote = ` (recurring ${args.recurring}${args.customInterval ? ' · ' + args.customInterval : ''})`;
        }
      }

      const sign        = type === 'expense' ? '-' : '+';
      const accountName = accountId ? accounts.find(a => a.id === accountId)?.name : null;
      const msg = `💰 ${sign}₹${amount} · ${args.description}${accountName ? ' · ' + accountName : ''}${recurringNote}`;
      return NextResponse.json({ success: true, action: 'ADD_TRANSACTION', message: msg, data: { id: row.id, amount, category, type } });
    }

    // ── TRANSFER MONEY ────────────────────────────────────────────────────────
    if (fn === 'transfer_money') {
      const amount = Math.abs(Number(args.amount));
      if (!amount || isNaN(amount)) return NextResponse.json({ success: false, message: 'Invalid transfer amount' });

      // Validate both IDs belong to this user
      const fromAcct = accounts.find(a => a.id === args.fromAccountId);
      const toAcct   = accounts.find(a => a.id === args.toAccountId);

      if (!fromAcct) return NextResponse.json({ success: false, message: `Source account not found. Say the full account name clearly.` });
      if (!toAcct)   return NextResponse.json({ success: false, message: `Destination account not found. Say the full account name clearly.` });
      if (fromAcct.id === toAcct.id) return NextResponse.json({ success: false, message: 'Source and destination accounts are the same' });

      const desc = args.description ?? `Transfer to ${toAcct.name}`;

      // Debit from source
      await prisma.transaction.create({
        data: { userId, accountId: fromAcct.id, date: today, category: 'Transfer', description: desc, notes: null, amount: await encryptNumber(amount), type: 'expense' },
      });
      await applyTransactionBalanceDelta(userId, { accountId: fromAcct.id, date: today, amount, type: 'expense' });

      // Credit to destination
      await prisma.transaction.create({
        data: { userId, accountId: toAcct.id, date: today, category: 'Transfer', description: `Transfer from ${fromAcct.name}`, notes: null, amount: await encryptNumber(amount), type: 'income' },
      });
      await applyTransactionBalanceDelta(userId, { accountId: toAcct.id, date: today, amount, type: 'income' });

      return NextResponse.json({
        success: true,
        action:  'TRANSFER',
        message: `🔄 Transferred ₹${amount} from ${fromAcct.name} → ${toAcct.name}`,
        data:    { amount, from: fromAcct.name, to: toAcct.name },
      });
    }

    // ── LOG HABIT ─────────────────────────────────────────────────────────────
    if (fn === 'log_habit') {
      const match = fuzzyMatch(habits, args.habitName);
      if (!match) return NextResponse.json({ success: false, message: `Habit "${args.habitName}" not found` });
      await prisma.habitLog.upsert({
        where:  { habitId_logDate: { habitId: match.id, logDate: today } },
        create: { habitId: match.id, userId, logDate: today, value: 1 },
        update: { value: 1 },
      });
      return NextResponse.json({ success: true, action: 'LOG_HABIT', message: `🔥 Logged "${match.name}" for today`, data: { id: match.id } });
    }

    // ── ADD GOAL ──────────────────────────────────────────────────────────────
    if (fn === 'add_goal') {
      const cat  = GOAL_CATEGORIES.includes(args.category) ? args.category : 'Personal';
      const goal = await prisma.goal.create({
        data: { userId, title: args.title, category: cat, why: args.why ?? null, deadline: args.deadline ?? null, status: 'active' },
      });
      return NextResponse.json({ success: true, action: 'ADD_GOAL', message: `🎯 Created goal "${goal.title}"`, data: { id: goal.id } });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' });

  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[ai-command]', e);
    return NextResponse.json({ error: 'Command failed', message: e.message }, { status: 500 });
  }
}

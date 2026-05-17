/**
 * /api/ai-command — Natural language command processor powered by Groq (Llama 3.3 70B).
 * Parses a user's text command, picks the right action via function calling,
 * executes it against the database, and returns a human-readable result.
 *
 * Supported actions:
 *   add_task         — "Add task buy groceries tomorrow high priority"
 *   complete_task    — "Mark task done: call dentist"
 *   add_transaction  — "Add ₹500 food on HDFC card"
 *   log_habit        — "Log meditation done"
 *   add_goal         — "Add goal learn guitar by December"
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber } from '@/lib/encryption';
import { applyTransactionBalanceDelta } from '@/lib/financeBalance';

export const runtime = 'nodejs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORIES = [
  'Rent', 'Groceries', 'Restaurants', 'Fuel', 'Transport', 'Utilities',
  'Internet', 'Mobile', 'Shopping', 'Subscriptions', 'Medical', 'Insurance',
  'Travel', 'Education', 'Gifts', 'Miscellaneous', 'Investment', 'Loan',
  'Food', 'Salary', 'Bonus', 'Freelance', 'Business', 'Dividends',
  'Interest', 'Rental Income', 'Cashback', 'Refund', 'Other Income',
];

const GOAL_CATEGORIES = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'];

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(Date.now() + 86400000); return d.toISOString().split('T')[0]; }
function nextWeekStr() { const d = new Date(Date.now() + 7 * 86400000); return d.toISOString().split('T')[0]; }

// Fuzzy name match — pick closest by lowercase includes, then first word
function fuzzyMatch<T extends { name?: string; title?: string }>(
  items: T[], query: string
): T | undefined {
  const q = query.toLowerCase().trim();
  return (
    items.find(i => (i.name ?? i.title ?? '').toLowerCase() === q) ??
    items.find(i => (i.name ?? i.title ?? '').toLowerCase().includes(q)) ??
    items.find(i => q.split(' ').some(w => (i.name ?? i.title ?? '').toLowerCase().includes(w)))
  );
}

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'Create a new task in the task list',
      parameters: {
        type: 'object',
        properties: {
          title:    { type: 'string', description: 'Task title' },
          dueDate:  { type: 'string', description: 'Due date in YYYY-MM-DD format (optional)' },
          priority: { type: 'string', enum: ['none', 'low', 'medium', 'high'], description: 'Task priority' },
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
          taskTitle: { type: 'string', description: 'Name or partial name of the task to complete' },
        },
        required: ['taskTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Add a financial transaction (expense or income)',
      parameters: {
        type: 'object',
        properties: {
          amount:      { type: 'number', description: 'Amount in INR (positive number)' },
          description: { type: 'string', description: 'Short label, e.g. "Office lunch", "Petrol"' },
          category:    { type: 'string', description: `One of: ${CATEGORIES.join(', ')}` },
          type:        { type: 'string', enum: ['expense', 'income'] },
          accountName: { type: 'string', description: 'Partial name of the bank/card account (optional)' },
        },
        required: ['amount', 'description', 'category', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_habit',
      description: "Mark a habit as completed for today",
      parameters: {
        type: 'object',
        properties: {
          habitName: { type: 'string', description: 'Name or partial name of the habit' },
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
          deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format (optional)' },
          why:      { type: 'string', description: 'Motivation / reason (optional)' },
        },
        required: ['title'],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const userId  = await requireUserId();
    const { command } = await req.json() as { command: string };
    if (!command?.trim()) {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    const today    = todayStr();
    const tomorrow = tomorrowStr();
    const nextWeek = nextWeekStr();

    // Fetch lightweight user context so Groq can match real names
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

    const systemPrompt = `You are a command interpreter for MyOrbit, a personal productivity app (Indian user, amounts in INR).
Today is ${today}. Tomorrow is ${tomorrow}. Next week is ${nextWeek}.

User's active tasks: ${tasks.map(t => t.title).join(', ') || 'none'}
User's habits: ${habits.map(h => h.name).join(', ') || 'none'}
User's accounts: ${accounts.map(a => `${a.name} (${a.type})`).join(', ') || 'none'}

Parse the command and call exactly one function. Match task/habit/account names loosely against the lists above.
For dates: convert natural language to YYYY-MM-DD. "today"="${today}", "tomorrow"="${tomorrow}".`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: command.trim() },
      ],
      tools:       TOOLS,
      tool_choice: 'auto',
      max_tokens:  512,
      temperature: 0.1,
    });

    const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return NextResponse.json({ success: false, message: "I couldn't understand that command. Try: 'Add task buy milk', 'Log meditation', 'Add ₹500 food expense'" });
    }

    const fn   = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments) as Record<string, any>;

    // ── Execute the action ────────────────────────────────────────────────────

    if (fn === 'add_task') {
      const task = await prisma.task.create({
        data: {
          userId,
          title:    args.title,
          priority: args.priority ?? 'none',
          dueDate:  args.dueDate  ?? null,
          tags:     '[]',
          status:   'active',
          isActive: true,
        },
      });
      const dateLabel = args.dueDate ? ` for ${args.dueDate}` : '';
      return NextResponse.json({ success: true, action: 'ADD_TASK', message: `✅ Created task "${task.title}"${dateLabel}`, data: { id: task.id } });
    }

    if (fn === 'complete_task') {
      const match = fuzzyMatch(tasks, args.taskTitle);
      if (!match) {
        return NextResponse.json({ success: false, message: `Couldn't find a task matching "${args.taskTitle}"` });
      }
      await prisma.task.update({ where: { id: match.id }, data: { status: 'completed', completedAt: new Date() } });
      return NextResponse.json({ success: true, action: 'COMPLETE_TASK', message: `✅ Completed "${match.title}"`, data: { id: match.id } });
    }

    if (fn === 'add_transaction') {
      const amount = Math.abs(Number(args.amount));
      if (!amount || isNaN(amount)) {
        return NextResponse.json({ success: false, message: 'Invalid amount' });
      }

      // Match account by name (optional)
      let accountId: string | null = null;
      if (args.accountName) {
        const acct = fuzzyMatch(accounts, args.accountName);
        if (acct) accountId = acct.id;
      }

      const category = CATEGORIES.includes(args.category) ? args.category : 'Miscellaneous';
      const type     = args.type === 'income' ? 'income' : 'expense';

      await prisma.transaction.create({
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

      const accountLabel = accountId ? ` on ${accounts.find(a => a.id === accountId)?.name}` : '';
      const sign = type === 'expense' ? '-' : '+';
      return NextResponse.json({ success: true, action: 'ADD_TRANSACTION', message: `💰 Added ${sign}₹${amount} · ${args.description}${accountLabel}`, data: { amount, category, type } });
    }

    if (fn === 'log_habit') {
      const match = fuzzyMatch(habits, args.habitName);
      if (!match) {
        return NextResponse.json({ success: false, message: `Couldn't find a habit matching "${args.habitName}"` });
      }
      // Upsert so double-logging today is idempotent
      await prisma.habitLog.upsert({
        where:  { habitId_logDate: { habitId: match.id, logDate: today } },
        create: { habitId: match.id, userId, logDate: today, value: 1 },
        update: { value: 1 },
      });
      return NextResponse.json({ success: true, action: 'LOG_HABIT', message: `🔥 Logged "${match.name}" for today`, data: { id: match.id } });
    }

    if (fn === 'add_goal') {
      const cat = GOAL_CATEGORIES.includes(args.category) ? args.category : 'Personal';
      const goal = await prisma.goal.create({
        data: {
          userId,
          title:    args.title,
          category: cat,
          why:      args.why ?? null,
          deadline: args.deadline ?? null,
          status:   'active',
        },
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

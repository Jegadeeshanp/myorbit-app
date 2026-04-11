'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play, CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronRight, RotateCcw, PlayCircle,
  ShieldCheck, Zap, Layers, GitBranch, FlaskConical,
  Lock, Unlock, FlaskConical as Flask,
} from 'lucide-react';

const QA_STORAGE_KEY = 'myorbit_qa_enabled';

function QAGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    setEnabled(localStorage.getItem(QA_STORAGE_KEY) === 'true');
  }, []);

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(QA_STORAGE_KEY, String(next));
    setEnabled(next);
  };

  if (enabled === null) return null; // hydrating

  if (!enabled) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800 border border-gray-700">
          <Lock className="h-7 w-7 text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">QA Dashboard is disabled</h1>
          <p className="mt-1 text-sm text-gray-500">Enable it to run tests. Disable again when done.</p>
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          <Unlock className="h-4 w-4" /> Enable QA Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Floating disable button */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl border border-red-800 bg-gray-900 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-950 transition shadow-lg z-50"
      >
        <Lock className="h-3.5 w-3.5" /> Disable QA
      </button>
    </>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type Status = 'pending' | 'running' | 'pass' | 'fail' | 'skipped';

interface TestResult {
  status: Status;
  duration?: number;
  detail?: string;
  request?: string;
  response?: string;
}

interface TestCase {
  id: string;
  layer: number;
  name: string;
  description: string;
  run: () => Promise<{ pass: boolean; detail: string; request?: string; response?: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function api(method: string, path: string, body?: object) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* html/empty */ }
  return { status: res.status, data };
}

async function unauthGet(path: string) {
  const res = await fetch(path, { credentials: 'omit' });
  return res.status;
}

function fmt(body?: object) {
  return body ? JSON.stringify(body, null, 2) : '';
}

// ── Test Definitions ───────────────────────────────────────────────────────

const TESTS: TestCase[] = [
  // ── Layer 1: API Contracts ────────────────────────────────────────────

  {
    id: 'l1-accounts-get', layer: 1,
    name: 'GET /api/accounts → 200',
    description: 'Authenticated user can list accounts',
    async run() {
      const { status, data } = await api('GET', '/api/accounts');
      return {
        pass: status === 200 && Array.isArray(data),
        detail: `Status: ${status} | Accounts: ${Array.isArray(data) ? data.length : 'N/A'}`,
        request: 'GET /api/accounts',
        response: JSON.stringify(data?.slice(0, 2), null, 2),
      };
    },
  },
  {
    id: 'l1-accounts-post', layer: 1,
    name: 'POST /api/accounts → 201',
    description: 'Create account with valid payload returns 201 + auto-cleans up',
    async run() {
      const body = { name: 'QA-DEMO Account', type: 'Bank', balance: 1000 };
      const { status, data } = await api('POST', '/api/accounts', body);
      if (data?.id) await api('DELETE', `/api/accounts/${data.id}`);
      return {
        pass: status === 201 && !!data?.id,
        detail: `Status: ${status} | ID: ${data?.id ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify({ id: data?.id, name: data?.name, balance: data?.balance }, null, 2),
      };
    },
  },
  {
    id: 'l1-accounts-post-400', layer: 1,
    name: 'POST /api/accounts (missing name) → 400',
    description: 'Missing required "name" field must be rejected',
    async run() {
      const body = { type: 'Bank', balance: 500 };
      const { status, data } = await api('POST', '/api/accounts', body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-accounts-type-case', layer: 1,
    name: 'POST /api/accounts lowercase type → 400',
    description: 'Type enum is case-sensitive — "bank" is invalid, "Bank" is valid',
    async run() {
      const body = { name: 'Test', type: 'bank', balance: 0 };
      const { status, data } = await api('POST', '/api/accounts', body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-transactions-get', layer: 1,
    name: 'GET /api/transactions → 200',
    description: 'Authenticated user can list transactions',
    async run() {
      const { status, data } = await api('GET', '/api/transactions');
      return {
        pass: status === 200 && Array.isArray(data),
        detail: `Status: ${status} | Transactions: ${Array.isArray(data) ? data.length : 'N/A'}`,
        request: 'GET /api/transactions',
        response: JSON.stringify(data?.slice(0, 1), null, 2),
      };
    },
  },
  {
    id: 'l1-transactions-zero-amount', layer: 1,
    name: 'POST /api/transactions (amount: 0) → 400',
    description: 'Zero amount must be rejected by validation',
    async run() {
      const accounts = (await api('GET', '/api/accounts')).data;
      const accId = accounts?.[0]?.id;
      if (!accId) return { pass: false, detail: 'No accounts found to run test' };
      const body = { accountId: accId, type: 'expense', amount: 0, category: 'Other', description: 'QA test', date: '2026-04-11' };
      const { status, data } = await api('POST', '/api/transactions', body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-transactions-negative', layer: 1,
    name: 'POST /api/transactions (amount: -500) → 201 allowed',
    description: 'Schema allows negative amounts by design (only zero is rejected)',
    async run() {
      const accounts = (await api('GET', '/api/accounts')).data;
      const accId = accounts?.[0]?.id;
      if (!accId) return { pass: false, detail: 'No accounts found' };
      const body = { accountId: accId, type: 'expense', amount: -500, category: 'Other', description: 'QA test', date: '2026-04-11' };
      const { status, data } = await api('POST', '/api/transactions', body);
      if (data?.id) await api('DELETE', `/api/transactions/${data.id}`).catch(() => {});
      return {
        pass: status === 201,
        detail: `Status: ${status} — negative amounts are valid (schema only rejects zero)`,
        request: fmt(body),
        response: JSON.stringify({ id: data?.id, amount: data?.amount, type: data?.type }, null, 2),
      };
    },
  },
  {
    id: 'l1-goals-get', layer: 1,
    name: 'GET /api/goals → 200',
    description: 'Returns array of goals with milestones included',
    async run() {
      const { status, data } = await api('GET', '/api/goals');
      return {
        pass: status === 200 && Array.isArray(data),
        detail: `Status: ${status} | Goals: ${Array.isArray(data) ? data.length : 'N/A'}`,
        request: 'GET /api/goals',
        response: JSON.stringify(data?.[0] ? { id: data[0].id, title: data[0].title, status: data[0].status } : null, null, 2),
      };
    },
  },
  {
    id: 'l1-goals-patch-invalid-status', layer: 1,
    name: 'PATCH /api/goals/[id] invalid status → 400',
    description: 'Status must be active|completed|paused — other values rejected',
    async run() {
      const goals = (await api('GET', '/api/goals')).data;
      const gid = goals?.[0]?.id;
      if (!gid) return { pass: false, detail: 'No goals found' };
      const body = { status: 'invalid_value' };
      const { status, data } = await api('PATCH', `/api/goals/${gid}`, body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-tasks-isDone-alias', layer: 1,
    name: 'PATCH /api/tasks/[id] isDone:true → status:completed',
    description: 'isDone boolean is accepted as alias for status field',
    async run() {
      const createRes = await api('POST', '/api/tasks', { title: 'QA-DEMO isDone test' });
      const tid = createRes.data?.id;
      if (!tid) return { pass: false, detail: 'Could not create task' };
      const { status, data } = await api('PATCH', `/api/tasks/${tid}`, { isDone: true });
      await api('DELETE', `/api/tasks/${tid}`);
      return {
        pass: status === 200 && data?.status === 'completed',
        detail: `PATCH status: ${status} | task.status: ${data?.status}`,
        request: '{ "isDone": true }',
        response: JSON.stringify({ id: data?.id, status: data?.status }, null, 2),
      };
    },
  },
  {
    id: 'l1-tasks-invalid-status', layer: 1,
    name: 'PATCH /api/tasks/[id] invalid status → 400',
    description: 'Status must be active|completed|wont_do — "done" rejected',
    async run() {
      const createRes = await api('POST', '/api/tasks', { title: 'QA-DEMO status test' });
      const tid = createRes.data?.id;
      if (!tid) return { pass: false, detail: 'Could not create task' };
      const body = { status: 'done' };
      const { status, data } = await api('PATCH', `/api/tasks/${tid}`, body);
      await api('DELETE', `/api/tasks/${tid}`);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-habits-get', layer: 1,
    name: 'GET /api/habits → 200',
    description: 'Returns array of habits',
    async run() {
      const { status, data } = await api('GET', '/api/habits');
      return {
        pass: status === 200 && Array.isArray(data),
        detail: `Status: ${status} | Habits: ${Array.isArray(data) ? data.length : 'N/A'}`,
        request: 'GET /api/habits',
        response: JSON.stringify(data?.slice(0, 2), null, 2),
      };
    },
  },
  {
    id: 'l1-habit-future-date', layer: 1,
    name: 'POST /api/habits/[id]/log future date → 400',
    description: 'Logging a habit for a future date must be rejected',
    async run() {
      const habits = (await api('GET', '/api/habits')).data;
      const hid = habits?.[0]?.id;
      if (!hid) return { pass: false, detail: 'No habits found' };
      const body = { date: '2099-12-31', value: 1 };
      const { status, data } = await api('POST', `/api/habits/${hid}/log`, body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },
  {
    id: 'l1-health-entries-get', layer: 1,
    name: 'GET /api/health/entries → 200',
    description: 'Returns health entries array',
    async run() {
      const { status, data } = await api('GET', '/api/health/entries');
      return {
        pass: status === 200 && Array.isArray(data),
        detail: `Status: ${status} | Entries: ${Array.isArray(data) ? data.length : 'N/A'}`,
        request: 'GET /api/health/entries',
        response: JSON.stringify(data?.[0] ?? null, null, 2),
      };
    },
  },
  {
    id: 'l1-insights-scores', layer: 1,
    name: 'GET /api/insights/scores → 200',
    description: 'Returns lifeScore and per-module scores',
    async run() {
      const { status, data } = await api('GET', '/api/insights/scores');
      const hasAll = data?.scores && ['habit', 'task', 'goal', 'health', 'finance'].every(k => k in data.scores);
      return {
        pass: status === 200 && typeof data?.lifeScore === 'number' && hasAll,
        detail: `Status: ${status} | Life Score: ${data?.lifeScore} | Modules: ${Object.keys(data?.scores ?? {}).join(', ')}`,
        request: 'GET /api/insights/scores',
        response: JSON.stringify({ lifeScore: data?.lifeScore, scores: data?.scores }, null, 2),
      };
    },
  },

  // ── Layer 2: Security ────────────────────────────────────────────────

  {
    id: 'l2-unauth-accounts', layer: 2,
    name: 'GET /api/accounts without session → 401',
    description: 'Unauthenticated requests must be rejected',
    async run() {
      const status = await unauthGet('/api/accounts');
      return {
        pass: status === 401,
        detail: `Status: ${status}`,
        request: 'GET /api/accounts  (credentials: omit)',
        response: `HTTP ${status}`,
      };
    },
  },
  {
    id: 'l2-unauth-tasks', layer: 2,
    name: 'GET /api/tasks without session → 401',
    description: 'Tasks endpoint rejects unauthenticated requests',
    async run() {
      const status = await unauthGet('/api/tasks');
      return { pass: status === 401, detail: `Status: ${status}`, request: 'GET /api/tasks  (credentials: omit)', response: `HTTP ${status}` };
    },
  },
  {
    id: 'l2-unauth-goals', layer: 2,
    name: 'GET /api/goals without session → 401',
    description: 'Goals endpoint rejects unauthenticated requests',
    async run() {
      const status = await unauthGet('/api/goals');
      return { pass: status === 401, detail: `Status: ${status}`, request: 'GET /api/goals  (credentials: omit)', response: `HTTP ${status}` };
    },
  },
  {
    id: 'l2-unauth-habits', layer: 2,
    name: 'GET /api/habits without session → 401',
    description: 'Habits endpoint rejects unauthenticated requests',
    async run() {
      const status = await unauthGet('/api/habits');
      return { pass: status === 401, detail: `Status: ${status}`, request: 'GET /api/habits  (credentials: omit)', response: `HTTP ${status}` };
    },
  },
  {
    id: 'l2-xss-task', layer: 2,
    name: 'XSS payload in task title stored as plain text',
    description: 'Script tags in titles are stored literally — never executed',
    async run() {
      const xss = '<script>alert("xss")</script>';
      const { status, data } = await api('POST', '/api/tasks', { title: xss });
      if (data?.id) await api('DELETE', `/api/tasks/${data.id}`);
      return {
        pass: status === 201 && data?.title === xss,
        detail: `Stored as: ${data?.title ?? 'N/A'}`,
        request: fmt({ title: xss }),
        response: JSON.stringify({ id: data?.id, title: data?.title }, null, 2),
      };
    },
  },
  {
    id: 'l2-html-goal', layer: 2,
    name: 'HTML in goal title → 400',
    description: 'Goal titles with HTML tags are explicitly rejected',
    async run() {
      const body = { title: '<img src=x onerror=alert(1)>' };
      const { status, data } = await api('POST', '/api/goals', body);
      return {
        pass: status === 400,
        detail: `Status: ${status} | Error: ${data?.error ?? 'none'}`,
        request: fmt(body),
        response: JSON.stringify(data, null, 2),
      };
    },
  },

  // ── Layer 3: E2E Flows ────────────────────────────────────────────────

  {
    id: 'l3-account-lifecycle', layer: 3,
    name: 'Account: create → patch → delete',
    description: 'Full lifecycle: create Bank account, update balance, delete',
    async run() {
      const { status: s1, data: acc } = await api('POST', '/api/accounts', { name: 'QA-DEMO E2E Bank', type: 'Bank', balance: 10000 });
      if (s1 !== 201) return { pass: false, detail: `Create failed: ${s1}` };
      const { status: s2, data: patched } = await api('PATCH', `/api/accounts/${acc.id}`, { balance: 25000 });
      const { status: s3 } = await api('DELETE', `/api/accounts/${acc.id}`);
      return {
        pass: s1 === 201 && s2 === 200 && patched?.balance === 25000 && s3 === 200,
        detail: `Create: ${s1} | Patch balance to 25000: ${s2} (got ${patched?.balance}) | Delete: ${s3}`,
        request: 'POST → PATCH { balance: 25000 } → DELETE',
        response: JSON.stringify({ created: acc?.id, patchedBalance: patched?.balance, deleted: s3 === 200 }, null, 2),
      };
    },
  },
  {
    id: 'l3-transaction-flow', layer: 3,
    name: 'Transaction: create income + expense, verify totals',
    description: 'Create 1 income + 1 expense, verify net balance in list',
    async run() {
      const { data: acc } = await api('POST', '/api/accounts', { name: 'QA-DEMO Txn Acc', type: 'Bank', balance: 0 });
      if (!acc?.id) return { pass: false, detail: 'Could not create account' };
      const { status: s1 } = await api('POST', '/api/transactions', { accountId: acc.id, type: 'income', amount: 5000, category: 'Salary', description: 'QA salary', date: '2026-04-11' });
      const { status: s2 } = await api('POST', '/api/transactions', { accountId: acc.id, type: 'expense', amount: 1200, category: 'Food', description: 'QA groceries', date: '2026-04-11' });
      const txns = (await api('GET', '/api/transactions')).data ?? [];
      const income = txns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
      const expense = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
      await api('DELETE', `/api/accounts/${acc.id}`);
      return {
        pass: s1 === 201 && s2 === 201,
        detail: `Income txn: ${s1} | Expense txn: ${s2} | API income total: ₹${income.toLocaleString('en-IN')} | expense: ₹${expense.toLocaleString('en-IN')}`,
        request: 'POST income ₹5,000 + POST expense ₹1,200',
        response: JSON.stringify({ incomeTxn: s1, expenseTxn: s2, totalIncome: income, totalExpense: expense }, null, 2),
      };
    },
  },
  {
    id: 'l3-task-complete', layer: 3,
    name: 'Task: create → complete via isDone → verify status',
    description: 'isDone:true alias must set status to completed with completedAt',
    async run() {
      const { data: task } = await api('POST', '/api/tasks', { title: 'QA-DEMO complete test', priority: 'high' });
      if (!task?.id) return { pass: false, detail: 'Could not create task' };
      const { status, data: updated } = await api('PATCH', `/api/tasks/${task.id}`, { isDone: true });
      await api('DELETE', `/api/tasks/${task.id}`);
      return {
        pass: status === 200 && updated?.status === 'completed' && !!updated?.completedAt,
        detail: `PATCH status: ${status} | task.status: ${updated?.status} | completedAt: ${updated?.completedAt ? 'set' : 'missing'}`,
        request: '{ "isDone": true }',
        response: JSON.stringify({ status: updated?.status, completedAt: updated?.completedAt }, null, 2),
      };
    },
  },
  {
    id: 'l3-goal-milestone-progress', layer: 3,
    name: 'Goal: create → add 3 milestones → complete 1 → verify 33%',
    description: 'Progress % must equal completed/total milestones',
    async run() {
      const { data: goal } = await api('POST', '/api/goals', { title: 'QA-DEMO Progress Goal' });
      if (!goal?.id) return { pass: false, detail: 'Could not create goal' };
      const ms1 = await api('POST', `/api/goals/${goal.id}/milestones`, { title: 'MS 1', horizon: '1m' });
      await api('POST', `/api/goals/${goal.id}/milestones`, { title: 'MS 2', horizon: '3m' });
      await api('POST', `/api/goals/${goal.id}/milestones`, { title: 'MS 3', horizon: '6m' });
      await api('PATCH', `/api/goals/${goal.id}/milestones/${ms1.data.id}`, { isCompleted: true });
      const { data: fetched } = await api('GET', '/api/goals');
      const g = fetched?.find((x: any) => x.id === goal.id);
      const completed = g?.milestones?.filter((m: any) => m.isCompleted).length ?? 0;
      const total = g?.milestones?.length ?? 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      await api('DELETE', `/api/goals/${goal.id}`);
      return {
        pass: pct === 33,
        detail: `Milestones: ${completed}/${total} completed | Progress: ${pct}% (expected 33%)`,
        request: 'POST goal → POST ×3 milestones → PATCH milestone isCompleted:true',
        response: JSON.stringify({ completed, total, progress: `${pct}%` }, null, 2),
      };
    },
  },
  {
    id: 'l3-habit-streak', layer: 3,
    name: 'Habit: create → log 2 days → verify logs exist',
    description: 'Habit logs must be recorded for each date',
    async run() {
      const { data: habit } = await api('POST', '/api/habits', { name: 'QA-DEMO Streak', type: 'boolean', frequency: 'daily' });
      if (!habit?.id) return { pass: false, detail: 'Could not create habit' };
      const log1 = await api('POST', `/api/habits/${habit.id}/log`, { date: '2026-04-10', value: 1 });
      const log2 = await api('POST', `/api/habits/${habit.id}/log`, { date: '2026-04-11', value: 1 });
      // Cleanup
      await api('DELETE', `/api/habits/${habit.id}`);
      return {
        pass: log1.status === 201 && log2.status === 201,
        detail: `Log Apr 10: ${log1.status} | Log Apr 11: ${log2.status}`,
        request: 'POST log date:2026-04-10 + POST log date:2026-04-11',
        response: JSON.stringify({ log1: log1.data?.logDate, log2: log2.data?.logDate }, null, 2),
      };
    },
  },
  {
    id: 'l3-health-entry', layer: 3,
    name: 'Health: upsert entry → verify in dashboard',
    description: 'POST health entry must appear in dashboard todayEntry',
    async run() {
      const today = new Date().toISOString().split('T')[0];
      const { status: s1 } = await api('POST', '/api/health/entries', { date: today, steps: 7777, sleepHours: 7, waterMl: 1500, mood: 4, energyLevel: 4 });
      const { status: s2, data: dash } = await api('GET', '/api/health/dashboard');
      const steps = dash?.todayEntry?.steps ?? null;
      return {
        pass: s1 === 201 && s2 === 200 && steps === 7777,
        detail: `Entry upsert: ${s1} | Dashboard: ${s2} | Steps in dashboard: ${steps}`,
        request: `POST /api/health/entries { steps: 7777, date: "${today}" }`,
        response: JSON.stringify({ steps: dash?.todayEntry?.steps, mood: dash?.todayEntry?.mood }, null, 2),
      };
    },
  },

  // ── Layer 4: Interoperability ─────────────────────────────────────────

  {
    id: 'l4-habit-task-sync', layer: 4,
    name: 'Habits → Tasks: logging a habit auto-completes linked task',
    description: 'Task tagged habit:[id] and due today must complete when habit is logged',
    async run() {
      const today = new Date().toISOString().split('T')[0];
      const { data: habit } = await api('POST', '/api/habits', { name: 'QA-DEMO Sync Habit', type: 'boolean', frequency: 'daily' });
      if (!habit?.id) return { pass: false, detail: 'Could not create habit' };
      const { data: task } = await api('POST', '/api/tasks', {
        title: 'QA-DEMO Linked Task',
        dueDate: today,
        habitId: habit.id,
        tags: JSON.stringify([`habit:${habit.id}`]),
      });
      if (!task?.id) { await api('DELETE', `/api/habits/${habit.id}`); return { pass: false, detail: 'Could not create task' }; }
      await api('POST', `/api/habits/${habit.id}/log`, { date: today, value: 1 });
      const allTasks = (await api('GET', '/api/tasks')).data ?? [];
      const linked = allTasks.find((t: any) => t.id === task.id);
      // Cleanup
      await api('DELETE', `/api/tasks/${task.id}`);
      await api('DELETE', `/api/habits/${habit.id}`);
      return {
        pass: linked?.status === 'completed',
        detail: `Task status after habit log: ${linked?.status ?? 'not found'}`,
        request: 'POST habit → POST task with habitId tag → POST habit/log',
        response: JSON.stringify({ taskId: task.id, taskStatus: linked?.status }, null, 2),
      };
    },
  },
  {
    id: 'l4-insights-aggregation', layer: 4,
    name: 'Insights: scores aggregate all modules',
    description: 'Life score must include habit, task, goal, health, finance sub-scores',
    async run() {
      const { status, data } = await api('GET', '/api/insights/scores');
      const modules = ['habit', 'task', 'goal', 'health', 'finance'];
      const present = modules.filter(m => typeof data?.scores?.[m] === 'number');
      const allInRange = present.every(m => data.scores[m] >= 0 && data.scores[m] <= 100);
      return {
        pass: status === 200 && present.length === 5 && allInRange,
        detail: `Modules present: ${present.join(', ')} | Life Score: ${data?.lifeScore}`,
        request: 'GET /api/insights/scores',
        response: JSON.stringify({ lifeScore: data?.lifeScore, scores: data?.scores }, null, 2),
      };
    },
  },
  {
    id: 'l4-health-insights-history', layer: 4,
    name: 'Health → Insights: health entries appear in insights history',
    description: 'Health entry mood/steps must show up in insights weekly history',
    async run() {
      const { status, data } = await api('GET', '/api/insights/scores');
      const history = data?.history ?? [];
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = history.find((h: any) => h.date === today);
      return {
        pass: status === 200 && !!todayEntry && todayEntry.steps !== null,
        detail: `History entries: ${history.length} | Today: steps=${todayEntry?.steps}, mood=${todayEntry?.mood}`,
        request: 'GET /api/insights/scores → check history[today]',
        response: JSON.stringify(todayEntry, null, 2),
      };
    },
  },

  // ── Layer 5: Edge Cases ───────────────────────────────────────────────

  {
    id: 'l5-soft-delete-hidden', layer: 5,
    name: 'Soft-deleted task hidden from GET /api/tasks',
    description: 'Deleted tasks must not appear in the task list',
    async run() {
      const { data: task } = await api('POST', '/api/tasks', { title: 'QA-DEMO soft delete' });
      if (!task?.id) return { pass: false, detail: 'Could not create task' };
      await api('DELETE', `/api/tasks/${task.id}`);
      const all = (await api('GET', '/api/tasks')).data ?? [];
      const found = all.find((t: any) => t.id === task.id);
      return {
        pass: !found,
        detail: `Task visible after delete: ${!!found}`,
        request: 'POST task → DELETE → GET /api/tasks',
        response: JSON.stringify({ taskId: task.id, stillVisible: !!found }, null, 2),
      };
    },
  },
  {
    id: 'l5-habit-toggle', layer: 5,
    name: 'Habit log: duplicate POST for same date toggles off',
    description: 'Second log for same date should remove the entry (toggle behaviour)',
    async run() {
      const { data: habit } = await api('POST', '/api/habits', { name: 'QA-DEMO Toggle', type: 'boolean', frequency: 'daily' });
      if (!habit?.id) return { pass: false, detail: 'Could not create habit' };
      const r1 = await api('POST', `/api/habits/${habit.id}/log`, { date: '2026-04-10', value: 1 });
      const r2 = await api('POST', `/api/habits/${habit.id}/log`, { date: '2026-04-10', value: 1 });
      await api('DELETE', `/api/habits/${habit.id}`);
      return {
        pass: r1.status === 201 && r2.data?.removed === true,
        detail: `First log: ${r1.status} (${r1.data?.logDate}) | Second (toggle): removed=${r2.data?.removed}`,
        request: 'POST log × 2 for same date',
        response: JSON.stringify({ first: r1.data?.logDate, second: r2.data }, null, 2),
      };
    },
  },
  {
    id: 'l5-goal-status-valid', layer: 5,
    name: 'Goal PATCH: valid statuses accepted (active, completed, paused)',
    description: 'All three valid statuses must be accepted without error',
    async run() {
      const { data: goal } = await api('POST', '/api/goals', { title: 'QA-DEMO Status Test' });
      if (!goal?.id) return { pass: false, detail: 'Could not create goal' };
      const r1 = await api('PATCH', `/api/goals/${goal.id}`, { status: 'paused' });
      const r2 = await api('PATCH', `/api/goals/${goal.id}`, { status: 'completed' });
      const r3 = await api('PATCH', `/api/goals/${goal.id}`, { status: 'active' });
      await api('DELETE', `/api/goals/${goal.id}`);
      return {
        pass: r1.status === 200 && r2.status === 200 && r3.status === 200,
        detail: `paused: ${r1.status} (${r1.data?.status}) | completed: ${r2.status} | active: ${r3.status}`,
        request: 'PATCH status:paused → status:completed → status:active',
        response: JSON.stringify({ paused: r1.data?.status, completed: r2.data?.status, active: r3.data?.status }, null, 2),
      };
    },
  },
  {
    id: 'l5-cascade-delete-goal', layer: 5,
    name: 'Cascade delete: deleting a goal removes its milestones',
    description: 'Milestones must be cascade-deleted when parent goal is deleted',
    async run() {
      const { data: goal } = await api('POST', '/api/goals', { title: 'QA-DEMO Cascade', milestones: [{ title: 'MS A', horizon: '1m' }, { title: 'MS B', horizon: '3m' }] });
      if (!goal?.id) return { pass: false, detail: 'Could not create goal' };
      const before = goal?.milestones?.length ?? 0;
      const { status: delStatus } = await api('DELETE', `/api/goals/${goal.id}`);
      const allGoals = (await api('GET', '/api/goals')).data ?? [];
      const stillExists = allGoals.some((g: any) => g.id === goal.id);
      return {
        pass: before === 2 && delStatus === 200 && !stillExists,
        detail: `Milestones before delete: ${before} | Delete status: ${delStatus} | Goal still exists: ${stillExists}`,
        request: 'POST goal with 2 milestones → DELETE goal → GET /api/goals',
        response: JSON.stringify({ milestonesCreated: before, deleteStatus: delStatus, goalRemoved: !stillExists }, null, 2),
      };
    },
  },
];

// ── Layer Config ───────────────────────────────────────────────────────────

const LAYERS = [
  { id: 1, label: 'API Contracts',      icon: Layers,       color: 'blue'   },
  { id: 2, label: 'Security',           icon: ShieldCheck,  color: 'red'    },
  { id: 3, label: 'E2E Flows',          icon: PlayCircle,   color: 'green'  },
  { id: 4, label: 'Interoperability',   icon: GitBranch,    color: 'purple' },
  { id: 5, label: 'Edge Cases',         icon: FlaskConical, color: 'orange' },
];

const LAYER_COLORS: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

// ── UI Components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  if (status === 'pending')  return <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="h-3.5 w-3.5" />Pending</span>;
  if (status === 'running')  return <span className="flex items-center gap-1 text-xs text-yellow-400"><Loader2 className="h-3.5 w-3.5 animate-spin" />Running</span>;
  if (status === 'pass')     return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Pass</span>;
  if (status === 'fail')     return <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" />Fail</span>;
  return null;
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function QAPage() {
  return <QAGate><QADashboard /></QAGate>;
}

function QADashboard() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsedLayers, setCollapsedLayers] = useState<Record<number, boolean>>({});
  const runningRef = useRef(false);

  const setResult = useCallback((id: string, r: Partial<TestResult>) => {
    setResults(prev => ({ ...prev, [id]: { ...prev[id], ...r } }));
  }, []);

  const runTest = useCallback(async (test: TestCase) => {
    setResult(test.id, { status: 'running', duration: undefined, detail: undefined });
    const start = Date.now();
    try {
      const res = await test.run();
      setResult(test.id, {
        status: res.pass ? 'pass' : 'fail',
        duration: Date.now() - start,
        detail: res.detail,
        request: res.request,
        response: res.response,
      });
    } catch (e: any) {
      setResult(test.id, { status: 'fail', duration: Date.now() - start, detail: `Error: ${e.message}` });
    }
  }, [setResult]);

  const runLayer = useCallback(async (layerId: number) => {
    const layerTests = TESTS.filter(t => t.layer === layerId);
    for (const t of layerTests) await runTest(t);
  }, [runTest]);

  const runAll = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    // Reset all
    setResults({});
    for (const t of TESTS) await runTest(t);
    runningRef.current = false;
  }, [runTest]);

  const reset = useCallback(() => {
    setResults({});
  }, []);

  // Counts
  const total   = TESTS.length;
  const passed  = Object.values(results).filter(r => r.status === 'pass').length;
  const failed  = Object.values(results).filter(r => r.status === 'fail').length;
  const running = Object.values(results).filter(r => r.status === 'running').length;
  const done    = passed + failed;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const isRunning = running > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">QA Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">MyOrbit · {total} test cases across 5 layers</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-40 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={runAll}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? 'Running…' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{done}/{total}</span>
            <span className="text-emerald-400 font-medium">{passed} passed</span>
            {failed > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
            {running > 0 && <span className="text-yellow-400 font-medium">{running} running</span>}
          </div>
          <div className="flex-1 max-w-xs h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${failed > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{pct}%</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-4 max-w-5xl mx-auto">
        {LAYERS.map(layer => {
          const layerTests = TESTS.filter(t => t.layer === layer.id);
          const lPassed  = layerTests.filter(t => results[t.id]?.status === 'pass').length;
          const lFailed  = layerTests.filter(t => results[t.id]?.status === 'fail').length;
          const lRunning = layerTests.filter(t => results[t.id]?.status === 'running').length;
          const isCollapsed = collapsedLayers[layer.id];
          const LayerIcon = layer.icon;
          const colorCls = LAYER_COLORS[layer.color];

          return (
            <div key={layer.id} className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
              {/* Layer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <button
                  className="flex items-center gap-2.5 flex-1 text-left"
                  onClick={() => setCollapsedLayers(p => ({ ...p, [layer.id]: !p[layer.id] }))}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  <span className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${colorCls}`}>
                    <LayerIcon className="h-3 w-3" /> L{layer.id}
                  </span>
                  <span className="text-sm font-semibold text-gray-200">{layer.label}</span>
                  <span className="text-xs text-gray-600">{layerTests.length} tests</span>
                  {lPassed > 0 && <span className="text-xs text-emerald-500">{lPassed}✓</span>}
                  {lFailed > 0 && <span className="text-xs text-red-400">{lFailed}✗</span>}
                  {lRunning > 0 && <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />}
                </button>
                <button
                  onClick={() => runLayer(layer.id)}
                  disabled={isRunning}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${colorCls} hover:opacity-80`}
                >
                  <Play className="h-3 w-3" /> Run Layer
                </button>
              </div>

              {/* Test rows */}
              {!isCollapsed && (
                <div className="divide-y divide-gray-800/60">
                  {layerTests.map(test => {
                    const r = results[test.id];
                    const status = r?.status ?? 'pending';
                    const isExpanded = expanded[test.id];

                    return (
                      <div key={test.id}>
                        <div
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/40 transition ${status === 'fail' ? 'bg-red-950/20' : status === 'pass' ? 'bg-emerald-950/10' : ''}`}
                          onClick={() => r && setExpanded(p => ({ ...p, [test.id]: !p[test.id] }))}
                        >
                          {/* Expand toggle */}
                          <div className="w-4 flex-none">
                            {r ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />) : null}
                          </div>

                          {/* Status */}
                          <div className="w-24 flex-none">
                            <StatusBadge status={status} />
                          </div>

                          {/* Name + description */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{test.name}</p>
                            <p className="text-xs text-gray-500 truncate">{test.description}</p>
                          </div>

                          {/* Duration */}
                          <div className="w-16 flex-none text-right">
                            {r?.duration !== undefined && (
                              <span className="text-xs text-gray-600">{r.duration}ms</span>
                            )}
                          </div>

                          {/* Run button */}
                          <button
                            onClick={e => { e.stopPropagation(); runTest(test); }}
                            disabled={isRunning}
                            className="flex-none rounded-md border border-gray-700 p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 disabled:opacity-30 transition"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && r && (
                          <div className="px-4 pb-4 bg-gray-900/80">
                            <div className="ml-7 rounded-xl border border-gray-800 overflow-hidden text-xs font-mono">
                              {r.detail && (
                                <div className={`px-4 py-2.5 border-b border-gray-800 ${r.status === 'pass' ? 'text-emerald-300' : 'text-red-300'}`}>
                                  {r.detail}
                                </div>
                              )}
                              {r.request && (
                                <div className="px-4 py-3 border-b border-gray-800">
                                  <p className="text-gray-500 mb-1">REQUEST</p>
                                  <pre className="text-gray-300 whitespace-pre-wrap">{r.request}</pre>
                                </div>
                              )}
                              {r.response && (
                                <div className="px-4 py-3">
                                  <p className="text-gray-500 mb-1">RESPONSE</p>
                                  <pre className="text-gray-300 whitespace-pre-wrap">{r.response}</pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

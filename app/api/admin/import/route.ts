import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function checkSecret(req: NextRequest) {
  const secret =
    req.headers.get('x-admin-secret') ??
    req.nextUrl.searchParams.get('secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

function uid() {
  return crypto.randomUUID();
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { targetUserId, data } = body as { targetUserId: string; data: any };

  if (!targetUserId || !data)
    return NextResponse.json({ error: 'targetUserId and data are required' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!targetUser)
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

  // ID remap maps: old id → new id
  const accountMap   = new Map<string, string>();
  const assetMap     = new Map<string, string>();
  const habitMap     = new Map<string, string>();
  const goalMap      = new Map<string, string>();
  const listMap      = new Map<string, string>();
  const taskMap      = new Map<string, string>();

  const stats: Record<string, number> = {};

  // ── 1. UserPreferences ────────────────────────────────────────────────────
  if (data.preferences) {
    const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, ...prefs } = data.preferences;
    await prisma.userPreferences.upsert({
      where:  { userId: targetUserId },
      create: { ...prefs, userId: targetUserId },
      update: prefs,
    });
    stats.preferences = 1;
  }

  // ── 2. UserCategories ─────────────────────────────────────────────────────
  if (data.categories?.length) {
    for (const cat of data.categories) {
      const { id: _id, userId: _u, createdAt: _c, ...rest } = cat;
      await prisma.userCategory.upsert({
        where:  { userId_name_type: { userId: targetUserId, name: rest.name, type: rest.type } },
        create: { ...rest, id: uid(), userId: targetUserId },
        update: rest,
      });
    }
    stats.categories = data.categories.length;
  }

  // ── 3. Accounts ───────────────────────────────────────────────────────────
  if (data.accounts?.length) {
    for (const acc of data.accounts) {
      const newId = uid();
      accountMap.set(acc.id, newId);
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, transactions: _t, ...rest } = acc;
      await prisma.account.create({ data: { ...rest, id: newId, userId: targetUserId } });
    }
    stats.accounts = data.accounts.length;
  }

  // ── 4. Assets ─────────────────────────────────────────────────────────────
  if (data.assets?.length) {
    for (const asset of data.assets) {
      const newId = uid();
      assetMap.set(asset.id, newId);
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, investmentTxs: _i, assetSips: _s, ...rest } = asset;
      const mappedAccountId = rest.accountId ? (accountMap.get(rest.accountId) ?? rest.accountId) : null;
      await prisma.asset.create({ data: { ...rest, id: newId, userId: targetUserId, accountId: mappedAccountId } });
    }
    stats.assets = data.assets.length;
  }

  // ── 5. Transactions ───────────────────────────────────────────────────────
  if (data.transactions?.length) {
    for (const tx of data.transactions) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, account: _acc, user: _user, ...rest } = tx;
      const mappedAccountId = rest.accountId ? (accountMap.get(rest.accountId) ?? null) : null;
      await prisma.transaction.create({ data: { ...rest, id: uid(), userId: targetUserId, accountId: mappedAccountId } });
    }
    stats.transactions = data.transactions.length;
  }

  // ── 6. RecurringTransactions ──────────────────────────────────────────────
  if (data.recurringTransactions?.length) {
    for (const rt of data.recurringTransactions) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, asset: _a, user: _user, ...rest } = rt;
      const mappedAccountId = rest.accountId ? (accountMap.get(rest.accountId) ?? null) : null;
      const mappedAssetId   = rest.assetId   ? (assetMap.get(rest.assetId)     ?? null) : null;
      await prisma.recurringTransaction.create({ data: { ...rest, id: uid(), userId: targetUserId, accountId: mappedAccountId, assetId: mappedAssetId } });
    }
    stats.recurringTransactions = data.recurringTransactions.length;
  }

  // ── 7. InvestmentTransactions ─────────────────────────────────────────────
  if (data.investmentTxs?.length) {
    for (const itx of data.investmentTxs) {
      const { id: _id, userId: _u, createdAt: _c, asset: _a, user: _user, ...rest } = itx;
      const mappedAssetId = assetMap.get(rest.assetId) ?? rest.assetId;
      await prisma.investmentTransaction.create({ data: { ...rest, id: uid(), userId: targetUserId, assetId: mappedAssetId } });
    }
    stats.investmentTxs = data.investmentTxs.length;
  }

  // ── 8. Liabilities ────────────────────────────────────────────────────────
  if (data.liabilities?.length) {
    for (const lib of data.liabilities) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, user: _user, ...rest } = lib;
      const mappedRepayId = rest.repaymentAccountId ? (accountMap.get(rest.repaymentAccountId) ?? null) : null;
      await prisma.liability.create({ data: { ...rest, id: uid(), userId: targetUserId, repaymentAccountId: mappedRepayId } });
    }
    stats.liabilities = data.liabilities.length;
  }

  // ── 9. Budgets ────────────────────────────────────────────────────────────
  if (data.budgets?.length) {
    for (const b of data.budgets) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, user: _user, ...rest } = b;
      await prisma.budget.create({ data: { ...rest, id: uid(), userId: targetUserId } });
    }
    stats.budgets = data.budgets.length;
  }

  // ── 10. Goals ─────────────────────────────────────────────────────────────
  if (data.goals?.length) {
    for (const goal of data.goals) {
      const newId = uid();
      goalMap.set(goal.id, newId);
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, milestones: _m, processes: _p, user: _user, ...rest } = goal;
      await prisma.goal.create({ data: { ...rest, id: newId, userId: targetUserId } });
    }
    stats.goals = data.goals.length;
  }

  // ── 11. GoalMilestones ────────────────────────────────────────────────────
  if (data.milestones?.length) {
    for (const ms of data.milestones) {
      const { id: _id, userId: _u, createdAt: _c, goal: _g, ...rest } = ms;
      const mappedGoalId = goalMap.get(rest.goalId) ?? rest.goalId;
      await prisma.goalMilestone.create({ data: { ...rest, id: uid(), userId: targetUserId, goalId: mappedGoalId } });
    }
    stats.milestones = data.milestones.length;
  }

  // ── 12. GoalProcesses ─────────────────────────────────────────────────────
  if (data.processes?.length) {
    for (const gp of data.processes) {
      const { id: _id, userId: _u, createdAt: _c, goal: _g, ...rest } = gp;
      const mappedGoalId = goalMap.get(rest.goalId) ?? rest.goalId;
      await prisma.goalProcess.create({ data: { ...rest, id: uid(), userId: targetUserId, goalId: mappedGoalId } });
    }
    stats.processes = data.processes.length;
  }

  // ── 13. Habits ────────────────────────────────────────────────────────────
  if (data.habits?.length) {
    for (const habit of data.habits) {
      const newId = uid();
      habitMap.set(habit.id, newId);
      const { id: _id, userId: _u, createdAt: _c, logs: _l, tasks: _t, user: _user, ...rest } = habit;
      await prisma.habit.create({ data: { ...rest, id: newId, userId: targetUserId } });
    }
    stats.habits = data.habits.length;
  }

  // ── 14. HabitLogs ─────────────────────────────────────────────────────────
  if (data.habitLogs?.length) {
    for (const log of data.habitLogs) {
      const { id: _id, userId: _u, createdAt: _c, habit: _h, ...rest } = log;
      const mappedHabitId = habitMap.get(rest.habitId) ?? rest.habitId;
      await prisma.habitLog.upsert({
        where:  { habitId_logDate: { habitId: mappedHabitId, logDate: rest.logDate } },
        create: { ...rest, id: uid(), userId: targetUserId, habitId: mappedHabitId },
        update: { value: rest.value },
      });
    }
    stats.habitLogs = data.habitLogs.length;
  }

  // ── 15. TaskLists ─────────────────────────────────────────────────────────
  if (data.taskLists?.length) {
    for (const list of data.taskLists) {
      const newId = uid();
      listMap.set(list.id, newId);
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, tasks: _t, user: _user, ...rest } = list;
      await prisma.taskList.create({ data: { ...rest, id: newId, userId: targetUserId } });
    }
    stats.taskLists = data.taskLists.length;
  }

  // ── 16. Tasks ─────────────────────────────────────────────────────────────
  if (data.tasks?.length) {
    for (const task of data.tasks) {
      const newId = uid();
      taskMap.set(task.id, newId);
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, subtasks: _s, instances: _i, list: _l, habit: _h, user: _user, ...rest } = task;
      const mappedListId  = rest.listId  ? (listMap.get(rest.listId)   ?? null) : null;
      const mappedHabitId = rest.habitId ? (habitMap.get(rest.habitId) ?? null) : null;
      await prisma.task.create({ data: { ...rest, id: newId, userId: targetUserId, listId: mappedListId, habitId: mappedHabitId } });
    }
    stats.tasks = data.tasks.length;
  }

  // ── 17. TaskSubtasks ──────────────────────────────────────────────────────
  if (data.subtasks?.length) {
    for (const sub of data.subtasks) {
      const { id: _id, userId: _u, createdAt: _c, task: _t, ...rest } = sub;
      const mappedTaskId = taskMap.get(rest.taskId) ?? rest.taskId;
      await prisma.taskSubtask.create({ data: { ...rest, id: uid(), userId: targetUserId, taskId: mappedTaskId } });
    }
    stats.subtasks = data.subtasks.length;
  }

  // ── 18. TaskInstances ─────────────────────────────────────────────────────
  if (data.taskInstances?.length) {
    for (const inst of data.taskInstances) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, task: _t, user: _user, ...rest } = inst;
      const mappedTaskId = taskMap.get(rest.taskId);
      if (!mappedTaskId) continue; // skip orphaned instances
      await prisma.taskInstance.upsert({
        where:  { taskId_date: { taskId: mappedTaskId, date: rest.date } },
        create: { ...rest, id: uid(), userId: targetUserId, taskId: mappedTaskId },
        update: { status: rest.status, isDeleted: rest.isDeleted, completedAt: rest.completedAt },
      });
    }
    stats.taskInstances = data.taskInstances.length;
  }

  // ── 19. HealthEntries ─────────────────────────────────────────────────────
  if (data.healthEntries?.length) {
    for (const he of data.healthEntries) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, user: _user, ...rest } = he;
      await prisma.healthEntry.upsert({
        where:  { userId_date: { userId: targetUserId, date: rest.date } },
        create: { ...rest, id: uid(), userId: targetUserId },
        update: rest,
      });
    }
    stats.healthEntries = data.healthEntries.length;
  }

  // ── 20. Workouts ──────────────────────────────────────────────────────────
  if (data.workouts?.length) {
    for (const w of data.workouts) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, user: _user, ...rest } = w;
      await prisma.workout.create({ data: { ...rest, id: uid(), userId: targetUserId } });
    }
    stats.workouts = data.workouts.length;
  }

  // ── 21. FoodLogs ──────────────────────────────────────────────────────────
  if (data.foodLogs?.length) {
    for (const fl of data.foodLogs) {
      const { id: _id, userId: _u, createdAt: _c, user: _user, ...rest } = fl;
      await prisma.foodLog.create({ data: { ...rest, id: uid(), userId: targetUserId } });
    }
    stats.foodLogs = data.foodLogs.length;
  }

  // ── 22. FoodEntries ───────────────────────────────────────────────────────
  if (data.foodEntries?.length) {
    for (const fe of data.foodEntries) {
      const { id: _id, userId: _u, createdAt: _c, updatedAt: _up, user: _user, ...rest } = fe;
      await prisma.foodEntry.create({ data: { ...rest, id: uid(), userId: targetUserId } });
    }
    stats.foodEntries = data.foodEntries.length;
  }

  // ── 23. Countdowns ────────────────────────────────────────────────────────
  if (data.countdowns?.length) {
    for (const cd of data.countdowns) {
      const { id: _id, userId: _u, createdAt: _c, user: _user, ...rest } = cd;
      await prisma.countdown.create({ data: { ...rest, id: uid(), userId: targetUserId } });
    }
    stats.countdowns = data.countdowns.length;
  }

  return NextResponse.json({ success: true, imported: stats });
}

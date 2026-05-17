import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkSecret(req: NextRequest) {
  const secret =
    req.headers.get('x-admin-secret') ??
    req.nextUrl.searchParams.get('secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId)
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [
    preferences,
    categories,
    accounts,
    transactions,
    recurringTransactions,
    assets,
    investmentTxs,
    liabilities,
    budgets,
    goals,
    milestones,
    processes,
    taskLists,
    tasks,
    subtasks,
    taskInstances,
    habits,
    habitLogs,
    healthEntries,
    workouts,
    foodLogs,
    foodEntries,
    countdowns,
  ] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId } }),
    prisma.userCategory.findMany({ where: { userId } }),
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.recurringTransaction.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.investmentTransaction.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.goalMilestone.findMany({ where: { userId } }),
    prisma.goalProcess.findMany({ where: { userId } }),
    prisma.taskList.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.taskSubtask.findMany({ where: { userId } }),
    prisma.taskInstance.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.habitLog.findMany({ where: { userId } }),
    prisma.healthEntry.findMany({ where: { userId } }),
    prisma.workout.findMany({ where: { userId } }),
    prisma.foodLog.findMany({ where: { userId } }),
    prisma.foodEntry.findMany({ where: { userId } }),
    prisma.countdown.findMany({ where: { userId } }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    sourceUser: { id: user.id, email: user.email, name: user.name },
    preferences,
    categories,
    accounts,
    transactions,
    recurringTransactions,
    assets,
    investmentTxs,
    liabilities,
    budgets,
    goals,
    milestones,
    processes,
    taskLists,
    tasks,
    subtasks,
    taskInstances,
    habits,
    habitLogs,
    healthEntries,
    workouts,
    foodLogs,
    foodEntries,
    countdowns,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="myorbit-export-${userId}-${Date.now()}.json"`,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';

    const [user, transactions, accounts, budgets, assets, liabilities, habits, tasks, goals, healthEntries, workouts] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
        prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.account.findMany({ where: { userId } }),
        prisma.budget.findMany({ where: { userId } }),
        prisma.asset.findMany({ where: { userId } }),
        prisma.liability.findMany({ where: { userId } }),
        prisma.habit.findMany({ where: { userId }, include: { logs: true } }),
        prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        prisma.goal.findMany({ where: { userId }, include: { milestones: true, processes: true } }),
        prisma.healthEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.workout.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      ]);

    if (format === 'json') {
      const payload = {
        exportedAt: new Date().toISOString(),
        user,
        finance: { accounts, transactions, budgets, assets, liabilities },
        habits,
        tasks,
        goals,
        health: { entries: healthEntries, workouts },
      };
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="myorbit-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // CSV: flatten transactions (the most useful single export)
    const header = 'Date,Type,Category,Description,Amount,Account\n';
    const rows = transactions.map(t =>
      [t.date, t.type, t.category, `"${t.description.replace(/"/g, '""')}"`, t.amount, t.accountId ?? ''].join(',')
    ).join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="myorbit-transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

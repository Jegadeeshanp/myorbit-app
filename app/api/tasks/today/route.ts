import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInstancesForDate } from '@/lib/taskInstanceGenerator';

export const runtime = 'nodejs';

function subDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const today = new Date().toISOString().split('T')[0];

    // Ensure instances exist for today before querying
    await generateInstancesForDate(userId, today);

    const yesterday = subDays(today, 1);
    const sevenAgo  = subDays(today, 7);

    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        isDeleted: false,
        date: { gte: sevenAgo, lte: today },
        task: { isDeleted: false },
      },
      include: {
        task: { include: { list: true } },
      },
    });

    const overdue   = instances.filter(i => i.date === yesterday && i.status === 'pending');
    const todayList = instances.filter(i => i.date === today     && i.status === 'pending');
    const missed    = instances.filter(i => i.date >= sevenAgo && i.date < yesterday && i.status === 'pending');
    const completed = instances.filter(i => i.date === today     && i.status === 'completed');

    return NextResponse.json({ overdue, today: todayList, missed, completed });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

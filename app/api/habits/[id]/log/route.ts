import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const habit = await prisma.habit.findFirst({ where: { id: id, userId } });
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    // Accept both `date` and `logDate` for compatibility
    const logDate = body.date || body.logDate || new Date().toISOString().split('T')[0];
    const value = body.value || 1;

    const today = new Date().toISOString().split('T')[0];
    if (logDate > today) {
      return NextResponse.json({ error: 'Cannot log a habit for a future date' }, { status: 400 });
    }

    // Toggle: if log exists for this date, remove it; otherwise create
    const existing = await prisma.habitLog.findUnique({
      where: { habitId_logDate: { habitId: id, logDate } },
    });
    if (existing) {
      await prisma.habitLog.delete({ where: { id: existing.id } });
      return NextResponse.json({ removed: true, logDate });
    }

    const log = await prisma.habitLog.create({
      data: { habitId: id, userId, logDate, value },
    });

    // Sync: if there's a task tagged habit:<id> due today, mark it complete
    try {
      const linkedTasks = await prisma.task.findMany({
        where: { userId, status: 'active', dueDate: logDate, tags: { contains: `habit:${id}` } },
        select: { id: true },
      });
      if (linkedTasks.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: linkedTasks.map(t => t.id) }, userId },
          data: { status: 'completed', completedAt: new Date() },
        });
      }
    } catch { /* habit→task sync failure must not affect habit UX */ }

    return NextResponse.json({ log, logDate }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const habit = await prisma.habit.findFirst({ where: { id: id, userId } });
    if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const logDate = searchParams.get('logDate') || new Date().toISOString().split('T')[0];
    await prisma.habitLog.deleteMany({
      where: { habitId: id, logDate },
    });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

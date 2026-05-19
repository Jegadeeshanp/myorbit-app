import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskCreateSchema } from '@/lib/validation';

export const runtime = 'nodejs';

function getRecurrenceFromTags(tags: string[] | string, dueDate?: string | null): { isRecurring: boolean; recurrenceDays: number[] | null } {
  let arr: string[] = [];
  try {
    if (Array.isArray(tags)) arr = tags;
    else { const p = JSON.parse(tags); if (Array.isArray(p)) arr = p; }
  } catch { /* ignore */ }

  const repeatTag = arr.find(t => t.startsWith('repeat:'));
  if (!repeatTag) return { isRecurring: false, recurrenceDays: null };
  const repeatType = repeatTag.replace('repeat:', '');

  switch (repeatType) {
    case 'daily':    return { isRecurring: true, recurrenceDays: [0,1,2,3,4,5,6] };
    case 'weekdays': return { isRecurring: true, recurrenceDays: [1,2,3,4,5] };
    case 'weekends': return { isRecurring: true, recurrenceDays: [0,6] };
    case 'weekly': {
      const dateStr = dueDate ?? new Date().toISOString().split('T')[0];
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

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const smartList = searchParams.get('smartList');
    const listId    = searchParams.get('listId');

    const today = new Date().toISOString().split('T')[0];
    const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let where: Record<string, unknown> = { userId, isDeleted: false };

    if (smartList === 'today')          where = { userId, isDeleted: false, dueDate: today, status: 'active', isActive: true };
    else if (smartList === 'inbox')     where = { userId, isDeleted: false, listId: null, status: 'active', isActive: true };
    else if (smartList === 'next7')     where = { userId, isDeleted: false, status: 'active', isActive: true, OR: [{ dueDate: { gte: today, lte: next7 } }, { isRecurring: true }] };
    else if (smartList === 'completed') where = { userId, isDeleted: false, status: 'completed', isActive: true };
    else if (smartList === 'trash')     where = { userId, isDeleted: false, isActive: false };
    else if (smartList === 'all')       where = { userId, isDeleted: false, status: 'active', isActive: true };
    else if (listId)                    where = { userId, isDeleted: false, listId, status: 'active', isActive: true };
    else                                where = { userId, isDeleted: false, isActive: true };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        list: true,
      },
      // FIX: sort by dueDate ASC (nulls last), then dueTime ASC (nulls last), then createdAt
      orderBy: [
        { dueDate: 'asc' },
        { dueTime: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Move tasks with no dueDate to the end (Prisma sorts nulls first for asc)
    const withDate    = tasks.filter(t => t.dueDate);
    const withoutDate = tasks.filter(t => !t.dueDate);

    return NextResponse.json([...withDate, ...withoutDate]);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = taskCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { title, notes, priority, dueDate, dueTime, tags, listId } = parsed.data;

    const tagsRaw = Array.isArray(tags) ? JSON.stringify(tags) : '[]';
    const { isRecurring, recurrenceDays } = getRecurrenceFromTags(tags ?? [], dueDate);

    const task = await prisma.task.create({
      data: {
        userId,
        title:   title.trim(),
        notes:   notes?.trim() || null,
        priority: priority || 'none',
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        tags:    tagsRaw,
        listId:  listId || null,
        isRecurring,
        ...(recurrenceDays !== null && { recurrenceDays }),
      },
      include: { subtasks: true, list: true },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
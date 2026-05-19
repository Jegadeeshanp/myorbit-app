import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { taskUpdateSchema } from '@/lib/validation';

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
      const dow = new Date(dateStr + 'T00:00:00Z').getUTCDay();
      return { isRecurring: true, recurrenceDays: [dow] };
    }
    default:
      return { isRecurring: false, recurrenceDays: null };
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({
      where: { id: id, userId },
      include: { subtasks: { orderBy: { sortOrder: 'asc' } }, list: true },
    });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const VALID_TASK_STATUSES = ['active', 'completed', 'wont_do'] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();

    const parsed = taskUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const body = parsed.data;

    // Support isDone boolean as alias for status
    let resolvedStatus = body.status;
    if (body.isDone !== undefined && body.status === undefined) {
      resolvedStatus = body.isDone ? 'completed' : 'active';
    }

    if (resolvedStatus !== undefined && !VALID_TASK_STATUSES.includes(resolvedStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_TASK_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    // Derive recurrence fields when tags are being updated
    let recurrenceUpdate: Record<string, unknown> = {};
    if (body.tags !== undefined) {
      const { isRecurring, recurrenceDays } = getRecurrenceFromTags(body.tags, body.dueDate);
      recurrenceUpdate = {
        isRecurring,
        recurrenceDays: recurrenceDays ?? [],
      };
    }

    const result = await prisma.task.updateMany({
      where: { id: id, userId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(resolvedStatus !== undefined && { status: resolvedStatus }),
        ...(resolvedStatus === 'completed' && { completedAt: new Date() }),
        ...(resolvedStatus === 'active' && { completedAt: null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        ...(body.dueTime !== undefined && { dueTime: body.dueTime }),
        ...(body.tags !== undefined && { tags: Array.isArray(body.tags) ? JSON.stringify(body.tags) : (typeof body.tags === 'string' ? body.tags : '[]') }),
        ...(body.listId !== undefined && { listId: body.listId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...recurrenceUpdate,
      },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.task.findFirst({
      where: { id: id, userId },
      include: { subtasks: true, list: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    // Hard soft-delete: mark task + all its instances as deleted
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { id, userId },
        data: { isDeleted: true },
      }),
      prisma.taskInstance.updateMany({
        where: { taskId: id, userId },
        data: { isDeleted: true, status: 'deleted' },
      }),
    ]);
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

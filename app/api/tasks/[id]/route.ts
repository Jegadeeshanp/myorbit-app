import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();
    const result = await prisma.task.updateMany({
      where: { id: id, userId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        ...(body.dueTime !== undefined && { dueTime: body.dueTime }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.listId !== undefined && { listId: body.listId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
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
    // Soft delete
    await prisma.task.updateMany({
      where: { id: id, userId },
      data: { isActive: false },
    });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

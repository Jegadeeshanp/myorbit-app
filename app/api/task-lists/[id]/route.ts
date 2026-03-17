import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();
    const result = await prisma.taskList.updateMany({
      where: { id: id, userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.taskList.findFirst({ where: { id: id, userId } });
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
    // Soft delete: move tasks to inbox (listId = null), then deactivate list
    await prisma.task.updateMany({
      where: { listId: id, userId },
      data: { listId: null },
    });
    await prisma.taskList.updateMany({
      where: { id: id, userId },
      data: { isActive: false },
    });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

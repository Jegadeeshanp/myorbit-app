/**
 * app/api/tasks/instances/[id]/route.ts
 * Handles completion (PATCH) and soft-deletion (DELETE) of task instances.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();

    // Only allow status: 'completed'
    if (body.status !== 'completed') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch and verify ownership
    const instance = await prisma.taskInstance.findFirst({
      where: { id, userId },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Complete all OTHER pending past instances for the same task so the user
    // doesn't have to dismiss duplicate overdue entries one by one.
    await prisma.taskInstance.updateMany({
      where: {
        taskId: instance.taskId,
        userId,
        status:    'pending',
        isDeleted: false,
        date:      { lt: today },
        id:        { not: id },
      },
      data: { status: 'completed', completedAt: new Date() },
    });

    // Update the target instance
    const updated = await prisma.taskInstance.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
      include: {
        task: {
          include: {
            list: {
              select: {
                id: true,
                name: true,
                color: true,
                emoji: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      taskId: updated.taskId,
      date: updated.date,
      status: updated.status,
      isDeleted: updated.isDeleted,
      completedAt: updated.completedAt?.toISOString() || null,
      task: {
        id: updated.task.id,
        title: updated.task.title,
        priority: updated.task.priority,
        dueTime: updated.task.dueTime,
        tags: updated.task.tags,
        listId: updated.task.listId,
        ...(updated.task.list && { list: updated.task.list }),
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[PATCH /api/tasks/instances/[id]]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();

    // Fetch and verify ownership
    const instance = await prisma.taskInstance.findFirst({
      where: { id, userId },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete: mark as deleted
    await prisma.taskInstance.update({
      where: { id },
      data: {
        isDeleted: true,
        status: 'deleted',
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[DELETE /api/tasks/instances/[id]]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

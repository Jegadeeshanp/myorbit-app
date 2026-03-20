// app/api/tasks/[id]/subtasks/[sid]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  try {
    const { id, sid } = await params;
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const subtask = await prisma.taskSubtask.update({
      where: { id: sid },
      data: {
        ...(body.title     !== undefined && { title:     body.title }),
        ...(body.isDone    !== undefined && { isDone:    body.isDone }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.notes     !== undefined && { notes:     body.notes }),
        ...(body.dueDate   !== undefined && { dueDate:   body.dueDate }),
        ...(body.dueTime   !== undefined && { dueTime:   body.dueTime }),
        ...(body.tags      !== undefined && { tags:      JSON.stringify(body.tags) }),
      },
    });
    // Return with tags parsed as array for client
    return NextResponse.json({
      ...subtask,
      tags: (() => { try { return JSON.parse(subtask.tags || '[]'); } catch { return []; } })(),
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  try {
    const { id, sid } = await params;
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.taskSubtask.delete({ where: { id: sid } });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id: id, userId } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const subtasks = await prisma.taskSubtask.findMany({
      where: { taskId: id },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(subtasks);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const task = await prisma.task.findFirst({ where: { id: id, userId } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const { title } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    const maxOrder = await prisma.taskSubtask.aggregate({
      where: { taskId: id },
      _max: { sortOrder: true },
    });
    const subtask = await prisma.taskSubtask.create({
      data: {
        taskId: id,
        userId,
        title: title.trim(),
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(subtask, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

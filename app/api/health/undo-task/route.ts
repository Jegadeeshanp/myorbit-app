import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const bodySchema = z.object({
  taskId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { taskId } = parsed.data;

    // 1. Fetch and verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { habit: true },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 2. Only allow undoing completed tasks
    if (task.status !== 'completed') {
      return NextResponse.json({ error: 'Task not completed' }, { status: 400 });
    }

    // 3. Mark task as incomplete
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'incomplete', completedAt: null },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[health/undo-task]', e?.message ?? e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

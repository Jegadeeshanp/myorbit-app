import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const ActionSchema = z.object({
  taskId: z.string().min(1),
  action: z.enum(['DONE', 'POSTPONE', 'CLOSE']),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { taskId, action } = parsed.data;

    const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown>;

    switch (action) {
      case 'DONE':
        updateData = { status: 'completed', completedAt: new Date() };
        break;
      case 'POSTPONE': {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData = { dueDate: tomorrow.toISOString().split('T')[0] };
        break;
      }
      case 'CLOSE':
        updateData = { status: 'wont_do' };
        break;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      select: { id: true, title: true, status: true, dueDate: true },
    });

    return NextResponse.json({ task: updated });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

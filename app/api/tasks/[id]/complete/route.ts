import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nextOccurrenceDate, extractRepeatValue, tagsForRecurrence } from '@/lib/taskRecurrence';

export const runtime = 'nodejs';

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();

    // Fetch the task before completing so we can inspect it
    const task = await prisma.task.findFirst({
      where: { id, userId },
      include: { subtasks: true, list: true },
    });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mark the current instance as completed
    await prisma.task.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
    });

    // ── Recurring task: spawn next occurrence ────────────────────────────────
    const repeatValue = extractRepeatValue(task.tags);
    if (repeatValue && task.dueDate) {
      const nextDate = nextOccurrenceDate(task.dueDate, repeatValue);
      if (nextDate) {
        // Create the next occurrence — same task data, new dueDate, fresh subtasks
        const newTags = tagsForRecurrence(task.tags);

        await prisma.task.create({
          data: {
            userId,
            title:     task.title,
            notes:     task.notes,
            priority:  task.priority,
            dueDate:   nextDate,
            dueTime:   task.dueTime,
            tags:      newTags,
            listId:    task.listId,
            sortOrder: task.sortOrder,
            status:    'active',
            isActive:  true,
            // Recreate subtasks (reset to not done)
            subtasks: task.subtasks.length > 0
              ? {
                  create: task.subtasks.map(st => ({
                    userId,
                    title:     st.title,
                    notes:     st.notes,
                    isDone:    false,
                    dueDate:   st.dueDate,
                    dueTime:   st.dueTime,
                    tags:      st.tags,
                    sortOrder: st.sortOrder,
                  })),
                }
              : undefined,
          },
        });
      }
    }

    // Return the completed task
    const updated = await prisma.task.findFirst({
      where: { id, userId },
      include: { subtasks: true, list: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

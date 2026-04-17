/**
 * app/api/tasks/today/route.ts
 * Returns TaskInstances for today partitioned into four sections:
 * - overdue:   yesterday's pending instances (exactly 1 day ago)
 * - today:     today's pending instances
 * - missed:    pending instances from 2–7 days ago
 * - completed: today's completed instances
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInstancesForDate } from '@/lib/taskInstanceGenerator';
import { TodayResponse, TaskInstanceWithTask } from '@/lib/taskTypes';

export const runtime = 'nodejs';

function subDays(dateStr: string, n: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().split('T')[0];
}

export async function GET(_: NextRequest) {
  try {
    const userId = await requireUserId();

    const today = new Date().toISOString().split('T')[0];

    // Generate instances for today (idempotent – skips duplicates)
    await generateInstancesForDate(userId, today);

    const yesterdayDate = subDays(today, 1);
    const sevenDaysAgo  = subDays(today, 7);

    // Fetch all non-deleted instances for non-deleted tasks in the window
    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        isDeleted: false,
        date: { gte: sevenDaysAgo, lte: today },
        task: { isDeleted: false },
      },
      include: {
        task: {
          include: {
            list: { select: { id: true, name: true, color: true, emoji: true } },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { task: { dueTime: 'asc' } }],
    });

    const overdue:   TaskInstanceWithTask[] = [];
    const todayList: TaskInstanceWithTask[] = [];
    const missed:    TaskInstanceWithTask[] = [];
    const completed: TaskInstanceWithTask[] = [];

    for (const instance of instances) {
      const mapped: TaskInstanceWithTask = {
        id:          instance.id,
        userId:      instance.userId,
        taskId:      instance.taskId,
        date:        instance.date,
        status:      instance.status as 'pending' | 'completed' | 'deleted',
        isDeleted:   instance.isDeleted,
        completedAt: instance.completedAt ? instance.completedAt.toISOString() : null,
        task: {
          id:       instance.task.id,
          title:    instance.task.title,
          priority: instance.task.priority,
          dueTime:  instance.task.dueTime,
          tags:     instance.task.tags,
          listId:   instance.task.listId,
          ...(instance.task.list && { list: instance.task.list }),
        },
      };

      if (instance.status === 'completed') {
        // Only show today's completed instances
        if (instance.date === today) completed.push(mapped);
      } else if (instance.status === 'pending') {
        // Skip pending instances whose task is completed or trashed
        if (!instance.task.isActive || (instance.task as any).status === 'completed') continue;

        if (instance.date === yesterdayDate) {
          overdue.push(mapped);
        } else if (instance.date === today) {
          todayList.push(mapped);
        } else if (instance.date >= sevenDaysAgo && instance.date < yesterdayDate) {
          missed.push(mapped);
        }
      }
    }

    const response: TodayResponse = {
      overdue,
      today:     todayList,
      missed,
      completed,
    };

    return NextResponse.json(response);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[GET /api/tasks/today]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

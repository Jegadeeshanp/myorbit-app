/**
 * app/api/tasks/today/route.ts
 * Returns tasks for today partitioned into four sections:
 * - overdue: yesterday's pending tasks
 * - today: today's pending tasks
 * - missed: pending tasks from 7 days ago to yesterday
 * - completed: today's completed tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInstancesForDate } from '@/lib/taskInstanceGenerator';
import { TodayResponse, TaskInstanceWithTask } from '@/lib/taskTypes';

export const runtime = 'nodejs';

/**
 * Helper: Subtract days from a YYYY-MM-DD string
 */
function subDays(dateStr: string, n: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().split('T')[0];
}

export async function GET(_: NextRequest) {
  try {
    const userId = await requireUserId();

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Generate instances for today (ensures recurring tasks have instances)
    await generateInstancesForDate(userId, today);

    // Compute date boundaries
    const yesterdayDate = subDays(today, 1);
    const sevenDaysAgo = subDays(today, 7);

    // Query TaskInstances with related Task info
    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        isDeleted: false,
        task: {
          isDeleted: false,
        },
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
      orderBy: [{ date: 'asc' }, { task: { priority: 'asc' } }],
    });

    // Partition into four sections
    const overdue: TaskInstanceWithTask[] = [];
    const todayTasks: TaskInstanceWithTask[] = [];
    const missed: TaskInstanceWithTask[] = [];
    const completed: TaskInstanceWithTask[] = [];

    for (const instance of instances) {
      const mapped: TaskInstanceWithTask = {
        id: instance.id,
        userId: instance.userId,
        taskId: instance.taskId,
        date: instance.date,
        status: instance.status as 'pending' | 'completed' | 'deleted',
        isDeleted: instance.isDeleted,
        completedAt: instance.completedAt ? instance.completedAt.toISOString() : null,
        task: {
          id: instance.task.id,
          title: instance.task.title,
          priority: instance.task.priority,
          dueTime: instance.task.dueTime,
          tags: instance.task.tags,
          listId: instance.task.listId,
          ...(instance.task.list && { list: instance.task.list }),
        },
      };

      if (instance.status === 'completed') {
        if (instance.date === today) {
          completed.push(mapped);
        }
      } else if (instance.status === 'pending') {
        if (instance.date === yesterdayDate) {
          overdue.push(mapped);
        } else if (instance.date === today) {
          todayTasks.push(mapped);
        } else if (instance.date >= sevenDaysAgo && instance.date < yesterdayDate) {
          missed.push(mapped);
        }
      }
    }

    const response: TodayResponse = {
      overdue,
      today: todayTasks,
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

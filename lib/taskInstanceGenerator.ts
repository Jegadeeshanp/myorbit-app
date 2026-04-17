/**
 * lib/taskInstanceGenerator.ts
 * Generates TaskInstance records for recurring tasks and tasks with due dates.
 * Called from the Today API and daily cleanup cron.
 */

import { prisma } from '@/lib/prisma';

/**
 * Generates TaskInstance records for a given date.
 * 1. Creates instances for recurring tasks that match the day-of-week
 * 2. Creates instances for non-recurring tasks with a dueDate matching the date
 */
export async function generateInstancesForDate(userId: string, date: string): Promise<void> {
  try {
    // Get day of week (0-6, Sunday=0)
    const dateObj = new Date(date + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay();

    // 1. Fetch all recurring active tasks for this user
    const recurringTasks = await prisma.task.findMany({
      where: {
        userId,
        isDeleted: false,
        isRecurring: true,
        isActive: true,
      },
    });

    // Create instances for matching recurring tasks
    const recurringInstances = recurringTasks
      .filter((task) => {
        if (!task.recurrenceDays) return false;
        const daysArray = Array.isArray(task.recurrenceDays)
          ? task.recurrenceDays
          : (task.recurrenceDays as { [key: string]: number } | number[]).valueOf?.() ||
            Object.values(task.recurrenceDays);
        return daysArray.includes(dayOfWeek);
      })
      .map((task) => ({
        userId,
        taskId: task.id,
        date,
        status: 'pending' as const,
      }));

    // 2. Fetch all non-recurring active tasks with dueDate = date
    const nonRecurringTasks = await prisma.task.findMany({
      where: {
        userId,
        isDeleted: false,
        isRecurring: false,
        isActive: true,
        dueDate: date,
      },
    });

    const nonRecurringInstances = nonRecurringTasks.map((task) => ({
      userId,
      taskId: task.id,
      date,
      status: 'pending' as const,
    }));

    // Combine and upsert all instances
    const allInstances = [...recurringInstances, ...nonRecurringInstances];

    if (allInstances.length === 0) return;

    // Use createMany with skipDuplicates to skip existing instances
    await prisma.taskInstance.createMany({
      data: allInstances,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('[generateInstancesForDate] error:', error);
    throw error;
  }
}

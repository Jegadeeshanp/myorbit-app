import { prisma } from '@/lib/prisma';

/** Pure helper — no external libraries */
function dayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay(); // 0=Sun … 6=Sat
}

/**
 * Generates TaskInstance rows for a given user + date.
 * - Recurring tasks: creates an instance if the date's day-of-week is in recurrenceDays.
 * - Non-recurring tasks with dueDate === date: creates an instance.
 * Uses createMany with skipDuplicates so it is safe to call multiple times.
 */
export async function generateInstancesForDate(
  userId: string,
  date: string,
): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { userId, isDeleted: false, isActive: true },
  });

  const dow = dayOfWeek(date);
  const instancesData: Array<{ userId: string; taskId: string; date: string }> = [];

  for (const task of tasks) {
    if (task.isRecurring) {
      const days = task.recurrenceDays as number[] | null;
      if (Array.isArray(days) && days.includes(dow)) {
        instancesData.push({ userId, taskId: task.id, date });
      }
    } else if (task.dueDate === date) {
      instancesData.push({ userId, taskId: task.id, date });
    }
  }

  if (instancesData.length === 0) return;

  await prisma.taskInstance.createMany({
    data: instancesData,
    skipDuplicates: true,
  });
}

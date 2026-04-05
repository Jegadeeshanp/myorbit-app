import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const today = new Date().toISOString().split('T')[0];

    // 7 days ago for weekly stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekStart = sevenDaysAgo.toISOString().split('T')[0];

    const [
      todayEntry,
      todayWorkouts,
      healthHabits,
      healthGoals,
      weeklyEntries,
      weeklyWorkouts,
    ] = await Promise.all([
      prisma.healthEntry.findUnique({ where: { userId_date: { userId, date: today } } }),
      prisma.workout.findMany({ where: { userId, date: today }, orderBy: { createdAt: 'desc' } }),
      prisma.habit.findMany({
        where: { userId, category: 'health', isActive: true },
        include: {
          logs: { where: { logDate: today } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.goal.findMany({
        where: { userId, category: 'Health', status: 'active' },
        include: { milestones: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.healthEntry.findMany({
        where: { userId, date: { gte: weekStart } },
        orderBy: { date: 'desc' },
      }),
      prisma.workout.findMany({
        where: { userId, date: { gte: weekStart } },
      }),
    ]);

    // Get today's health tasks (tasks linked to health habits)
    const healthHabitIds = healthHabits.map(h => h.id);
    const healthTasks = healthHabitIds.length > 0
      ? await prisma.task.findMany({
          where: {
            userId,
            habitId: { in: healthHabitIds },
            status: 'active',
          },
          include: { habit: true },
          orderBy: { sortOrder: 'asc' },
        })
      : [];

    // Shape habits with completedToday flag
    const shapedHabits = healthHabits.map(h => ({
      id: h.id,
      name: h.name,
      color: h.color,
      iconEmoji: h.iconEmoji,
      goalPerDay: h.goalPerDay,
      isCountBased: h.isCountBased,
      daysOfWeek: h.daysOfWeek,
      category: h.category,
      completedToday: h.logs.length > 0,
      todayValue: h.logs[0]?.value ?? 0,
    }));

    // Weekly stats
    const habitsCompletedThisWeek = await prisma.habitLog.count({
      where: {
        userId,
        logDate: { gte: weekStart, lte: today },
        habit: { category: 'health', isActive: true },
      },
    });

    const avgSleep =
      weeklyEntries.filter(e => e.sleepHours != null).length > 0
        ? weeklyEntries.reduce((sum, e) => sum + (e.sleepHours ?? 0), 0) /
          weeklyEntries.filter(e => e.sleepHours != null).length
        : 0;

    return NextResponse.json({
      todayEntry,
      todayWorkouts,
      healthHabits: shapedHabits,
      healthTasks,
      healthGoals,
      weeklyStats: {
        habitsCompletedThisWeek,
        workoutsThisWeek: weeklyWorkouts.length,
        avgSleep: Math.round(avgSleep * 10) / 10,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[health/dashboard]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

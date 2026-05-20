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
      todayFoodLogs,
      healthHabits,
      healthGoals,
      weeklyEntries,
      weeklyWorkouts,
    ] = await Promise.all([
      prisma.healthEntry.findUnique({ where: { userId_date: { userId, date: today } } }),
      prisma.workout.findMany({ where: { userId, date: today }, orderBy: { createdAt: 'desc' } }),
      prisma.foodEntry.findMany({
        where: { userId, date: today },
        select: { id: true, name: true, mealType: true, calories: true, proteinG: true, carbsG: true, fatG: true, fiberG: true },
        orderBy: { createdAt: 'asc' },
      }),
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

    // Categorize tasks into today/overdue/missed
    const todayDate = today;
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    const twoDaysAgoDate = new Date();
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgoDate.toISOString().split('T')[0];

    const todayTasks = healthTasks.filter(t => 
      !t.dueDate || t.dueDate === todayDate || t.dueDate > todayDate
    );
    
    const overdueTasks = healthTasks.filter(t => 
      t.dueDate === yesterdayStr
    );
    
    const missedTasks = healthTasks.filter(t => 
      t.dueDate && t.dueDate < yesterdayStr
    );

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
      todayFoodLogs,
      healthHabits: shapedHabits,
      healthTasks: {
        today: todayTasks,
        overdue: overdueTasks,
        missed: missedTasks,
      },
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

import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const today = new Date().toISOString().split('T')[0];
    const d7ago = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const d30ago = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // Habit score: completion rate over last 7 days
    const habits = await prisma.habit.findMany({ where: { userId, isActive: true }, include: { logs: { where: { logDate: { gte: d7ago } } } } });
    const habitScore = habits.length > 0
      ? Math.min(100, Math.round((habits.reduce((s, h) => s + Math.min(h.logs.length, 7), 0) / (habits.length * 7)) * 100))
      : 0;

    // Task score: completed instances in last 7 days vs total scheduled instances
    // Using TaskInstance rather than Task so recurring-task completions are counted correctly
    const [completedInstances, totalInstances] = await Promise.all([
      prisma.taskInstance.count({ where: { userId, status: 'completed', completedAt: { gte: new Date(d7ago) }, isDeleted: false } }),
      prisma.taskInstance.count({ where: { userId, isDeleted: false, date: { gte: d7ago, lte: today } } }),
    ]);
    const taskScore = totalInstances > 0 ? Math.min(100, Math.round((completedInstances / totalInstances) * 100)) : 0;

    // Goal score: active goals with milestones completed
    const goals = await prisma.goal.findMany({ where: { userId, status: 'active' }, include: { milestones: true } });
    const goalScore = goals.length > 0
      ? Math.min(100, Math.round(goals.reduce((s, g) => {
          const total = g.milestones.length;
          const done = g.milestones.filter(m => m.isCompleted).length;
          return s + (total > 0 ? (done / total) * 100 : 0);
        }, 0) / goals.length))
      : 0;

    // Health score: based on entries in last 7 days
    const healthEntries = await prisma.healthEntry.findMany({ where: { userId, date: { gte: d7ago } } });
    const avgMood = healthEntries.length > 0 ? healthEntries.reduce((s, e) => s + (e.mood ?? 3), 0) / healthEntries.length : 0;
    const avgEnergy = healthEntries.length > 0 ? healthEntries.reduce((s, e) => s + (e.energyLevel ?? 5), 0) / healthEntries.length : 0;
    const healthScore = healthEntries.length > 0 ? Math.min(100, Math.round((avgMood / 5) * 50 + (avgEnergy / 10) * 50)) : 0;

    // Finance score: daily logging consistency (7 tx/week = full score)
    const txCount = await prisma.transaction.count({ where: { userId, date: { gte: d7ago } } });
    const financeScore = txCount === 0 ? 0 : Math.min(100, 30 + Math.round((txCount / 7) * 70));

    // Life score weighted average
    const lifeScore = Math.round(
      habitScore  * 0.30 +
      taskScore   * 0.20 +
      goalScore   * 0.20 +
      healthScore * 0.20 +
      financeScore * 0.10
    );

    // History: last 30 days (health entries for sparkline)
    const history = await prisma.healthEntry.findMany({ where: { userId, date: { gte: d30ago } }, orderBy: { date: 'asc' } });

    // Generate insights
    const insights: { type: string; title: string; body: string; severity: string }[] = [];
    if (habitScore >= 80) insights.push({ type: 'habit', title: '🔥 Habit machine!', body: `You completed ${habitScore}% of your habits this week. Keep it up!`, severity: 'info' });
    else if (habits.length > 0 && habitScore < 40) insights.push({ type: 'habit', title: '⚡ Habits slipping', body: `Only ${habitScore}% completion this week. Log your habits daily for streaks.`, severity: 'warning' });
    if (goalScore > 50) insights.push({ type: 'goal', title: '🎯 Goals on track', body: `${goals.length} active goal${goals.length !== 1 ? 's' : ''} with strong milestone progress.`, severity: 'info' });
    if (healthEntries.length === 0) insights.push({ type: 'health', title: '💊 Track your health', body: 'Log your mood, sleep, and steps daily to unlock your Health Score.', severity: 'tip' });
    else if (avgMood >= 4) insights.push({ type: 'health', title: '😊 Great mood streak', body: `Average mood of ${avgMood.toFixed(1)}/5 this week — you're thriving!`, severity: 'info' });
    if (completedInstances >= 5) insights.push({ type: 'task', title: '✅ Productive week', body: `You completed ${completedInstances} tasks in the last 7 days. Great momentum!`, severity: 'info' });

    return NextResponse.json({
      lifeScore,
      scores: { habit: habitScore, task: taskScore, goal: goalScore, health: healthScore, finance: financeScore },
      insights,
      history: history.map(e => ({ date: e.date, mood: e.mood, energy: e.energyLevel, steps: e.steps })),
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

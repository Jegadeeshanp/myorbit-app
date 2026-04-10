import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const WORKOUT_TYPE_MAP: Record<string, string> = {
  running: 'running',
  run: 'running',
  cycling: 'cycling',
  cycle: 'cycling',
  bike: 'cycling',
  strength: 'strength',
  gym: 'strength',
  weights: 'strength',
  yoga: 'yoga',
  sports: 'sports',
  sport: 'sports',
};

function habitNameToWorkoutType(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(WORKOUT_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'other';
}

const bodySchema = z.object({
  taskId: z.string().min(1),
  steps: z.number().int().positive().optional(),
  durationMins: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { taskId, steps, durationMins } = parsed.data;
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch and verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { habit: true },
    });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 2. Mark task as completed
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'completed', completedAt: new Date() },
    });

    let habitLog = null;
    let workout = null;

    // 3. If no habitId or habit is not health category, return early (task was completed, skip health)
    if (!task.habitId || !task.habit || task.habit.category !== 'health') {
      return NextResponse.json({ task: updatedTask, habitLog: null, workout: null });
    }

    const habit = task.habit;

    // 4. Create HabitLog for today if not exists
    try {
      habitLog = await prisma.habitLog.create({
        data: { habitId: habit.id, userId, logDate: today, value: 1 },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation (already logged today) — skip silently
      if (err.code !== 'P2002') throw err;
      habitLog = await prisma.habitLog.findFirst({
        where: { habitId: habit.id, logDate: today },
      });
    }

    // 5. Check for existing workout today with same type, skip if duplicate
    const workoutType = habitNameToWorkoutType(habit.name);
    const existingWorkout = await prisma.workout.findFirst({
      where: { userId, date: today, type: workoutType },
    });

    if (!existingWorkout) {
      workout = await prisma.workout.create({
        data: {
          userId,
          name: habit.name,
          type: workoutType,
          durationMins: durationMins ?? 30,
          date: today,
          notes: `Auto-created from task: ${task.title}`,
        },
      });
    } else {
      workout = existingWorkout;
    }

    // 6. If steps provided and workout is a walking/running type, upsert HealthEntry.steps
    const isStepsActivity = ['running', 'other'].includes(workoutType) ||
      habit.name.toLowerCase().includes('walk') ||
      habit.name.toLowerCase().includes('run');

    if (steps && isStepsActivity) {
      await prisma.healthEntry.upsert({
        where: { userId_date: { userId, date: today } },
        update: { steps },
        create: { userId, date: today, steps },
      });
    }

    return NextResponse.json({ task: updatedTask, habitLog, workout });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[health/complete-task]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

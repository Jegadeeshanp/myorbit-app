import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { habitCreateSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const d30ago = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      include: {
        logs: {
          where: { logDate: { gte: d30ago } },
          orderBy: { logDate: 'desc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(habits);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = habitCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name, color, iconEmoji, goalPerDay, isCountBased, daysOfWeek, timeOfDay, customTime } = parsed.data;
    const maxOrder = await prisma.habit.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: name.trim(),
        color: color || '#3B82F6',
        iconEmoji: iconEmoji || '✅',
        goalPerDay: goalPerDay || 1,
        isCountBased: isCountBased || false,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : '[0,1,2,3,4,5,6]',
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        timeOfDay: timeOfDay || 'all_day',
        customTime: customTime || null,
      },
      include: { logs: true },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

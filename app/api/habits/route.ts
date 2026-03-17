import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const today = new Date().toISOString().split('T')[0];
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      include: {
        logs: { where: { logDate: today } },
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
    const body = await req.json();
    const { name, color, iconEmoji, goalPerDay, isCountBased, daysOfWeek } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
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
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : '[1,2,3,4,5,6,7]',
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
      include: { logs: true },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

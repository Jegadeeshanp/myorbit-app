import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const countdowns = await prisma.countdown.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(countdowns);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { name, iconEmoji, targetDate, direction } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    if (!targetDate) return NextResponse.json({ error: 'Target date required' }, { status: 400 });
    const maxOrder = await prisma.countdown.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const countdown = await prisma.countdown.create({
      data: {
        userId,
        name: name.trim(),
        iconEmoji: iconEmoji || '🎯',
        targetDate,
        direction: direction || 'until',
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(countdown, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

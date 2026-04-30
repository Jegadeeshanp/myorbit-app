import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const workouts = await prisma.workout.findMany({
      where: { userId, ...(date ? { date } : {}) },
      orderBy: { date: 'desc' },
      take: limit,
    });
    return NextResponse.json(workouts);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { name, type, durationMins, caloriesBurned, distanceKm, date, notes } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

    const workout = await prisma.workout.create({
      data: {
        userId,
        name: name.trim(),
        type: type || 'other',
        durationMins: durationMins || 30,
        caloriesBurned: caloriesBurned ?? null,
        distanceKm: distanceKm ?? null,
        date,
        notes: notes?.trim() ?? null,
      },
    });
    return NextResponse.json(workout, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

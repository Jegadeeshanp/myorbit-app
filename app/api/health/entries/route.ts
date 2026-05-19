import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { healthEntrySchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
      const entry = await prisma.healthEntry.findUnique({
        where: { userId_date: { userId, date } },
      });
      return NextResponse.json(entry);
    }

    const limit = parseInt(searchParams.get('limit') ?? '30', 10);
    const entries = await prisma.healthEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
    return NextResponse.json(entries);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = healthEntrySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { date, steps, sleepHours, waterMl, weightKg, mood, energyLevel, heartRate, notes } = parsed.data;

    const entry = await prisma.healthEntry.upsert({
      where: { userId_date: { userId, date } },
      update: {
        steps: steps ?? undefined,
        sleepHours: sleepHours ?? undefined,
        waterMl: waterMl ?? undefined,
        weightKg: weightKg ?? undefined,
        mood: mood ?? undefined,
        energyLevel: energyLevel ?? undefined,
        heartRate: heartRate ?? undefined,
        notes: notes ?? undefined,
      },
      create: {
        userId, date,
        steps: steps ?? null,
        sleepHours: sleepHours ?? null,
        waterMl: waterMl ?? null,
        weightKg: weightKg ?? null,
        mood: mood ?? null,
        energyLevel: energyLevel ?? null,
        heartRate: heartRate ?? null,
        notes: notes ?? null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

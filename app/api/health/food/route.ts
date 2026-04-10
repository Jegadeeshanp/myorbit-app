import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const foodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(200),
  mealType: z.enum(['morning', 'noon', 'evening', 'night']).default('evening'),
  calories: z.number().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  saturatedFatG: z.number().nonnegative().optional(),
  sodiumMg: z.number().nonnegative().optional(),
  potassiumMg: z.number().nonnegative().optional(),
  fiberG: z.number().nonnegative().optional(),
  waterMl: z.number().nonnegative().optional(),
  servingSize: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const entries = await prisma.foodEntry.findMany({
      where: { userId, date },
      orderBy: { createdAt: 'asc' },
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
    const body = await req.json();
    const parsed = foodSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

    const entry = await prisma.foodEntry.create({
      data: { userId, ...parsed.data },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

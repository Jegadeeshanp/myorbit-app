import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const foodLogSchema = z.object({
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  foodName:     z.string().min(1, 'Food name required').max(200),
  mealType:     z.enum(['breakfast', 'lunch', 'dinner', 'snack']).default('snack'),
  servingSize:  z.string().max(50).optional().nullable(),
  servingGrams: z.number().positive().optional().nullable(),
  calories:     z.number().min(0).optional().nullable(),
  protein:      z.number().min(0).optional().nullable(),
  carbs:        z.number().min(0).optional().nullable(),
  fats:         z.number().min(0).optional().nullable(),
  saturatedFat: z.number().min(0).optional().nullable(),
  sodium:       z.number().min(0).optional().nullable(),
  potassium:    z.number().min(0).optional().nullable(),
  fiber:        z.number().min(0).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const logs = await prisma.foodLog.findMany({
      where: { userId, ...(date ? { date } : {}) },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return NextResponse.json(logs);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = foodLogSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { date, foodName, mealType, servingSize, servingGrams, calories, protein, carbs, fats, saturatedFat, sodium, potassium, fiber } = parsed.data;

    const log = await prisma.foodLog.create({
      data: {
        userId, date,
        foodName: foodName.trim(),
        mealType,
        servingSize: servingSize ?? null,
        servingGrams: servingGrams ?? null,
        calories: calories ?? null,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fats: fats ?? null,
        saturatedFat: saturatedFat ?? null,
        sodium: sodium ?? null,
        potassium: potassium ?? null,
        fiber: fiber ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[POST /api/food-logs]', e?.message ?? e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.workout.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { name, type, durationMins, caloriesBurned, distanceKm, date, notes } = body;
    const workout = await prisma.workout.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        type: type ?? existing.type,
        durationMins: durationMins ?? existing.durationMins,
        caloriesBurned: caloriesBurned ?? existing.caloriesBurned,
        distanceKm: distanceKm ?? existing.distanceKm,
        date: date ?? existing.date,
        notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
      },
    });
    return NextResponse.json(workout);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await prisma.workout.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.workout.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

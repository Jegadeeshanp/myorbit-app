import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  try {
    const { id, mid } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const existing = await prisma.goalMilestone.findFirst({ where: { id: mid, goalId: id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const milestone = await prisma.goalMilestone.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
        ...(body.horizon !== undefined && { horizon: body.horizon }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      },
    });
    return NextResponse.json(milestone);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  try {
    const { id, mid } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = await prisma.goalMilestone.findFirst({ where: { id: mid, goalId: id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.goalMilestone.delete({ where: { id: existing.id } });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

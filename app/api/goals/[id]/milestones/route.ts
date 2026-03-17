import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const milestones = await prisma.goalMilestone.findMany({
      where: { goalId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(milestones);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const { title, horizon, dueDate } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    const milestone = await prisma.goalMilestone.create({
      data: {
        goalId: id,
        userId,
        title: title.trim(),
        horizon: horizon || '1m',
        dueDate: dueDate || null,
      },
    });
    return NextResponse.json(milestone, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

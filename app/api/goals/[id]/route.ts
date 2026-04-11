import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({
      where: { id: id, userId },
      include: {
        milestones: { orderBy: { horizon: 'asc' } },
        processes: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(goal);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

const VALID_GOAL_STATUSES = ['active', 'completed', 'paused'] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();
    if (body.status !== undefined && !VALID_GOAL_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_GOAL_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }
    const result = await prisma.goal.updateMany({
      where: { id: id, userId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.why !== undefined && { why: body.why }),
        ...(body.metric !== undefined && { metric: body.metric }),
        ...(body.deadline !== undefined && { deadline: body.deadline }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.goal.findFirst({
      where: { id: id, userId },
      include: { milestones: true, processes: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await prisma.goal.deleteMany({ where: { id: id, userId } });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

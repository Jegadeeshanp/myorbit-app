import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        milestones: { orderBy: { createdAt: 'asc' } },
        processes: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { title, category, why, metric, deadline, milestones = [], processes = [] } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        category: category || 'Personal',
        why: why?.trim() || null,
        metric: metric?.trim() || null,
        deadline: deadline || null,
        milestones: {
          create: milestones.map((m: any) => ({ userId, title: m.title, horizon: m.horizon || '1m' })),
        },
        processes: {
          create: processes.map((p: any) => ({ userId, title: p.title, frequency: p.frequency || 'daily' })),
        },
      },
      include: { milestones: true, processes: true },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

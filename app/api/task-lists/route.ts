import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const lists = await prisma.taskList.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { tasks: { where: { status: 'active', isActive: true, isDeleted: false } } } },
      },
    });
    return NextResponse.json(lists);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { name, emoji, color } = body;
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const maxOrder = await prisma.taskList.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const list = await prisma.taskList.create({
      data: {
        userId,
        name: name.trim(),
        emoji: emoji || null,
        color: color || '#3B82F6',
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
    return NextResponse.json(list, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[POST /api/task-lists]', e?.message ?? e);
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

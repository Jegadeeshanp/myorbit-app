import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const result = await prisma.task.updateMany({
      where: { id: id, userId },
      data: { isActive: true, status: 'active', completedAt: null },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.task.findFirst({
      where: { id: id, userId },
      include: { subtasks: true, list: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

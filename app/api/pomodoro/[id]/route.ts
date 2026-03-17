import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();
    const session = await prisma.pomodoroSession.updateMany({
      where: { id: id, userId },
      data: {
        endedAt: body.endedAt ? new Date(body.endedAt) : new Date(),
        durationSecs: body.durationSecs || null,
        wasCompleted: body.wasCompleted ?? false,
      },
    });
    if (session.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.pomodoroSession.findFirst({ where: { id: id, userId } });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

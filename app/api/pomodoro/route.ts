import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const sessions = await prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(sessions);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { taskId, taskTitle, mode } = body;
    const session = await prisma.pomodoroSession.create({
      data: {
        userId,
        taskId: taskId || null,
        taskTitle: taskTitle || null,
        mode: mode || 'pomo',
        startedAt: new Date(),
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

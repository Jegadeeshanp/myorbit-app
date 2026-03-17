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
    const processes = await prisma.goalProcess.findMany({
      where: { goalId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(processes);
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
    const { title, frequency } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });
    const process = await prisma.goalProcess.create({
      data: {
        goalId: id,
        userId,
        title: title.trim(),
        frequency: frequency || 'daily',
      },
    });
    return NextResponse.json(process, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  try {
    const { id, pid } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const existing = await prisma.goalProcess.findFirst({ where: { id: pid, goalId: id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const process = await prisma.goalProcess.update({
      where: { id: existing.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(process);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  try {
    const { id, pid } = await params;
    const userId = await requireUserId();
    const goal = await prisma.goal.findFirst({ where: { id: id, userId } });
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const existing = await prisma.goalProcess.findFirst({ where: { id: pid, goalId: id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.goalProcess.delete({ where: { id: existing.id } });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

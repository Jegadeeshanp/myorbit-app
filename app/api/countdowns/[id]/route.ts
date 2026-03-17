import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const body = await req.json();
    const result = await prisma.countdown.updateMany({
      where: { id: id, userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.iconEmoji !== undefined && { iconEmoji: body.iconEmoji }),
        ...(body.targetDate !== undefined && { targetDate: body.targetDate }),
        ...(body.direction !== undefined && { direction: body.direction }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.countdown.findFirst({ where: { id: id, userId } });
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
    await prisma.countdown.updateMany({
      where: { id: id, userId },
      data: { isActive: false },
    });
    return NextResponse.json({ deleted: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

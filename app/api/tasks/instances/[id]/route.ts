import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const patchSchema = z.object({
  status: z.literal('completed'),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Verify ownership
    const instance = await prisma.taskInstance.findFirst({
      where: { id, userId },
    });
    if (!instance) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.taskInstance.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: { task: { include: { list: true } } },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // Verify ownership
    const instance = await prisma.taskInstance.findFirst({
      where: { id, userId },
    });
    if (!instance) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.taskInstance.update({
      where: { id },
      data: { isDeleted: true, status: 'deleted' },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

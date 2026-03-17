import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parsed = budgetSchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const updateData: any = { ...parsed.data };
    let row: any;
    try {
      row = await prisma.budget.update({ where: { id }, data: updateData });
    } catch (e: any) {
      // category column may not exist yet — retry without it
      if (e.message?.includes('category') || e.code === 'P2009' || e.constructor?.name === 'PrismaClientValidationError') {
        const { category: _c, ...safeData } = updateData;
        row = await prisma.budget.update({ where: { id }, data: safeData });
      } else { throw e; }
    }
    return NextResponse.json({ id: row.id, name: row.name, budget: row.budget, spent: row.spent, category: row.category ?? '' });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.budget.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

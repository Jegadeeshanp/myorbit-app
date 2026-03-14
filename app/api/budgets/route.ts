import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(rows.map(r => ({ id: r.id, name: r.name, budget: r.budget, spent: r.spent })));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = budgetSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { name, budget, spent = 0 } = parsed.data;
    const row = await prisma.budget.create({ data: { userId, name, budget, spent } });
    return NextResponse.json({ id: row.id, name: row.name, budget: row.budget, spent: row.spent }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

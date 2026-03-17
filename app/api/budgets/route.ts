import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(rows.map(r => ({ id: r.id, name: r.name, budget: r.budget, spent: r.spent, category: (r as any).category ?? '' })));
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

    const { name, budget, spent = 0, category = '' } = parsed.data;
    let row: any;
    try {
      row = await prisma.budget.create({ data: { userId, name, budget, spent, category } as any });
    } catch (e: any) {
      // category column may not exist yet — retry without it
      if (e.message?.includes('category') || e.code === 'P2009' || e.constructor?.name === 'PrismaClientValidationError') {
        row = await prisma.budget.create({ data: { userId, name, budget, spent } });
      } else { throw e; }
    }
    return NextResponse.json({ id: row.id, name: row.name, budget: row.budget, spent: row.spent, category: row.category ?? '' }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

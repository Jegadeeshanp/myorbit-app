import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';
import { decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

/**
 * Compute how much has actually been spent in the given calendar month
 * (defaults to current month). For past months the full month range is used;
 * for the current month only dates <= today are counted.
 */
async function computeSpent(
  userId: string,
  budget: { name: string; category?: string | null },
  month?: string, // YYYY-MM, defaults to current month
): Promise<number> {
  const now        = new Date();
  const today      = now.toLocaleDateString('en-CA');
  const targetMonth = month ?? today.slice(0, 7);
  const monthStart  = `${targetMonth}-01`;
  // For past months include the full month; for current cap at today
  const isCurrentMonth = targetMonth === today.slice(0, 7);
  const monthEnd   = isCurrentMonth
    ? today
    : new Date(Number(targetMonth.slice(0, 4)), Number(targetMonth.slice(5, 7)), 0)
        .toLocaleDateString('en-CA');

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { amount: true, category: true },
  });

  const cats = budget.category
    ? budget.category.split(',').map((c: string) => c.trim()).filter(Boolean)
    : [];

  let total = 0;
  for (const row of rows) {
    const matches = cats.length === 0
      || cats.includes(row.category)
      || budget.name === row.category;
    if (!matches) continue;
    const amt = await decryptNumber(row.amount);
    total += Math.abs(amt);
  }
  return Math.round(total);
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const month  = new URL(req.url).searchParams.get('month') ?? undefined; // YYYY-MM or undefined
    const rows   = await prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });

    // Always compute spent fresh from transactions (never use stored value)
    const result = await Promise.all(rows.map(async r => ({
      id:       r.id,
      name:     r.name,
      budget:   r.budget,
      spent:    await computeSpent(userId, { name: r.name, category: (r as any).category }, month),
      category: (r as any).category ?? '',
    })));

    return NextResponse.json(result);
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

    const { name, budget, category = '' } = parsed.data;
    let row: any;
    try {
      row = await prisma.budget.create({ data: { userId, name, budget, spent: 0, category } as any });
    } catch (e: any) {
      // category column may not exist yet — retry without it
      if (e.message?.includes('category') || e.code === 'P2009' || e.constructor?.name === 'PrismaClientValidationError') {
        row = await prisma.budget.create({ data: { userId, name, budget, spent: 0 } });
      } else { throw e; }
    }

    // Compute current spent from real transactions
    const spent = await computeSpent(userId, { name: row.name, category: row.category });
    return NextResponse.json({ id: row.id, name: row.name, budget: row.budget, spent, category: row.category ?? '' }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

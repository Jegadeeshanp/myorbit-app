import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

async function decryptTemplate(row: any) {
  return {
    id:              row.id,
    accountId:       row.accountId ?? undefined,
    category:        row.category,
    description:     row.description,
    notes:           row.notes ?? undefined,
    amount:          await decryptNumber(row.amount),
    type:            row.type,
    recurringConfig: JSON.parse(row.recurringConfig),
    nextDate:        row.nextDate,
    occurrenceCount: row.occurrenceCount,
  };
}

/** GET /api/recurring-transactions — list all templates for the current user */
export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.recurringTransaction.findMany({
      where: { userId },
      orderBy: { nextDate: 'asc' },
    });
    return NextResponse.json(await Promise.all(rows.map(decryptTemplate)));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

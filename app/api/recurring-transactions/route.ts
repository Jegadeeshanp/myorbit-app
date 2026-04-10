import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptNumber } from '@/lib/encryption';
import { processRecurring } from '@/lib/processRecurring';

export const runtime = 'nodejs';

async function decryptTemplate(row: any) {
  return {
    id:              row.id,
    accountId:       row.accountId ?? undefined,
    assetId:         row.assetId   ?? undefined, // present for asset SIPs
    category:        row.category,
    description:     row.description,
    notes:           row.notes ?? undefined,
    amount:          await decryptNumber(row.amount),
    type:            row.type, // 'expense' | 'income' | 'SIP'
    recurringConfig: JSON.parse(row.recurringConfig),
    nextDate:        row.nextDate,
    occurrenceCount: row.occurrenceCount,
  };
}

/**
 * POST /api/recurring-transactions — immediately process overdue templates
 * for the authenticated user.  Called on app load so users don't have to
 * wait for the 01:00 UTC cron to see recurring transactions fire.
 */
export async function POST() {
  try {
    const userId = await requireUserId();
    const spawned = await processRecurring(userId);
    return NextResponse.json({ ok: true, spawned });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
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

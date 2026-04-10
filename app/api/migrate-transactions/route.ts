/**
 * POST /api/migrate-transactions
 *
 * One-time migration: updates old category-based special transactions
 * to use proper first-class transaction types:
 *   - category='Transfer'          + type='expense'|'income' → type='transfer'
 *   - category='Opening Balance'   + type='income'|'expense' → type='opening_balance'
 *   - category='Balance Adjustment'+ type='income'|'expense' → type='adjustment'
 *
 * Safe to run multiple times (only updates rows that still have the old type).
 */

import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const userId = await requireUserId();

    // Migrate Transfer transactions (both sides: old expense/income → transfer)
    const transferResult = await prisma.transaction.updateMany({
      where: {
        userId,
        category: 'Transfer',
        type: { in: ['expense', 'income'] },
      },
      data: { type: 'transfer' },
    });

    // Migrate Opening Balance transactions
    const openingResult = await prisma.transaction.updateMany({
      where: {
        userId,
        category: 'Opening Balance',
        type: { in: ['income', 'expense'] },
      },
      data: { type: 'opening_balance' },
    });

    // Migrate Balance Adjustment transactions
    const adjustResult = await prisma.transaction.updateMany({
      where: {
        userId,
        category: 'Balance Adjustment',
        type: { in: ['income', 'expense'] },
      },
      data: { type: 'adjustment' },
    });

    return NextResponse.json({
      ok: true,
      migrated: {
        transfers:        transferResult.count,
        openingBalances:  openingResult.count,
        adjustments:      adjustResult.count,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Migration error:', e);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

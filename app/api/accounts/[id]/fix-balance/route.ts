import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

/**
 * POST /api/accounts/[id]/fix-balance
 *
 * Inserts a signed "adjustment" transaction equal to
 *   diff = storedBalance - sum(all transaction amounts for this account)
 * so that the running transaction sum equals the stored account balance.
 * The stored balance is never modified; only a new transaction is inserted.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // Verify account belongs to this user
    const account = await prisma.account.findFirst({ where: { id, userId } });
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const storedBalance = await decryptNumber(account.balance);

    // 1. Sum all transaction amounts for this account (all amounts are signed)
    const txRows = await prisma.transaction.findMany({
      where: { accountId: id, userId },
      select: { amount: true },
    });
    const amounts = await Promise.all(txRows.map(r => decryptNumber(r.amount)));
    const calculatedBalance = amounts.reduce((s, a) => s + a, 0);

    // 2. Compute difference
    const diff = Math.round((storedBalance - calculatedBalance) * 100) / 100;

    if (Math.abs(diff) < 1) {
      return NextResponse.json({ ok: true, diff: 0, message: 'Already balanced' });
    }

    // 3. Insert signed adjustment transaction (diff is positive if stored > tx sum, negative otherwise)
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
    const tx = await prisma.transaction.create({
      data: {
        userId,
        accountId: id,
        date: today,
        category: 'Adjustment',
        description: 'Balance adjustment',
        notes: 'Auto balance fix',
        amount: await encryptNumber(diff),
        type: 'adjustment',
      },
    });

    return NextResponse.json({
      ok: true,
      diff,
      transaction: {
        id:          tx.id,
        accountId:   tx.accountId,
        date:        tx.date,
        category:    tx.category,
        description: tx.description,
        notes:       tx.notes ?? undefined,
        amount:      diff,
        type:        tx.type,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

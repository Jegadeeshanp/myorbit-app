/**
 * app/api/assets/[id]/transactions/route.ts
 * GET — list all InvestmentTransactions for a specific asset.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assetId } = await params;
    const userId = await requireUserId();

    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rows = await prisma.investmentTransaction.findMany({
      where: { assetId, userId },
      orderBy: { date: 'desc' },
    });

    const decrypted = await Promise.all(rows.map(async r => ({
      id:     r.id,
      assetId: r.assetId,
      type:   r.type,
      amount: await decryptNumber(r.amount),
      date:   r.date,
      note:   r.note ?? undefined,
    })));

    return NextResponse.json(decrypted);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

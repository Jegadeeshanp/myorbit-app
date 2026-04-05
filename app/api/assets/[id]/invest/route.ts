/**
 * app/api/assets/[id]/invest/route.ts
 *
 * POST — record a money movement for an asset.
 *   body: { type: 'LUMPSUM' | 'SIP' | 'REDEMPTION', amount: number, date: string, note?: string, accountId?: string }
 *
 * - Creates an InvestmentTransaction record (amount always stored positive).
 * - If accountId is provided:
 *     LUMPSUM / SIP  → expense transaction + debit account
 *     REDEMPTION     → income transaction  + credit account
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  type:      z.enum(['LUMPSUM', 'SIP', 'REDEMPTION']),
  amount:    z.number().positive(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note:      z.string().max(500).optional(),
  accountId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assetId } = await params;
    const userId = await requireUserId();

    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { type, amount, date, note, accountId } = parsed.data;

    // 1. Create InvestmentTransaction
    const invTx = await prisma.investmentTransaction.create({
      data: {
        assetId,
        userId,
        type,
        amount: await encryptNumber(amount), // always positive
        date,
        note: note ?? null,
      },
    });

    // 2. If account linked — create a mirror Transaction + adjust balance
    const today = new Date().toLocaleDateString('en-CA');
    const accId = accountId ?? null;
    if (accId && date <= today) {
      const account = await prisma.account.findFirst({ where: { id: accId, userId } });
      if (account) {
        const isRedemption = type === 'REDEMPTION';
        const txType   = isRedemption ? 'income' : 'expense';
        const txAmount = isRedemption ? amount : -amount;

        await prisma.transaction.create({
          data: {
            userId,
            accountId: accId,
            date,
            category: 'Investment',
            description: `${asset.name} — ${type}`,
            notes: note ?? null,
            amount: await encryptNumber(txAmount),
            type: txType,
          },
        });

        const currentBalance = await decryptNumber(account.balance);
        await prisma.account.update({
          where: { id: accId },
          data: { balance: await encryptNumber(currentBalance + txAmount) },
        });
      }
    }

    // 3. Compute updated invested total and sync Asset.invested + Asset.value
    const invTxRows = await prisma.investmentTransaction.findMany({
      where: { assetId, userId, type: { in: ['LUMPSUM', 'SIP'] } },
    });
    const newInvested = (await Promise.all(invTxRows.map(r => decryptNumber(r.amount))))
      .reduce((s, v) => s + v, 0);

    // For SIP / LUMPSUM: also update current value by the same amount added.
    // REDEMPTION reduces value instead.
    const currentValue = await decryptNumber(asset.value);
    const valueDelta = type === 'REDEMPTION' ? -amount : amount;
    const newValue = Math.max(0, currentValue + valueDelta);

    await prisma.asset.update({
      where: { id: assetId },
      data: {
        invested: await encryptNumber(newInvested),
        value:    await encryptNumber(newValue),
      },
    });

    return NextResponse.json({
      id:     invTx.id,
      assetId,
      type,
      amount,
      date,
      note:   note ?? undefined,
    }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
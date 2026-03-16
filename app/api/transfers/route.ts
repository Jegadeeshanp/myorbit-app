import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

const transferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId:   z.string().min(1),
  amount:        z.number().positive('Amount must be positive'),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  description:   z.string().min(1).max(500).default('Transfer'),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = transferSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { fromAccountId, toAccountId, amount, date, description } = parsed.data;

    if (fromAccountId === toAccountId)
      return NextResponse.json({ error: 'Source and destination accounts must differ' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      // Verify ownership of both accounts
      const [fromAcct, toAcct] = await Promise.all([
        tx.account.findFirst({ where: { id: fromAccountId, userId } }),
        tx.account.findFirst({ where: { id: toAccountId, userId } }),
      ]);
      if (!fromAcct) throw new Error('Source account not found');
      if (!toAcct)   throw new Error('Destination account not found');

      // Decrypt current balances
      const [fromBal, toBal] = await Promise.all([
        decryptNumber(fromAcct.balance),
        decryptNumber(toAcct.balance),
      ]);

      const newFromBal = fromBal - amount;
      const newToBal   = toBal  + amount;

      // Encrypt new balances
      const [encFromBal, encToBal, encOutAmt, encInAmt] = await Promise.all([
        encryptNumber(newFromBal),
        encryptNumber(newToBal),
        encryptNumber(-amount),
        encryptNumber(amount),
      ]);

      // Create both transaction legs
      const [txOut, txIn] = await Promise.all([
        tx.transaction.create({
          data: { userId, accountId: fromAccountId, date, category: 'Transfer', description, amount: encOutAmt, type: 'expense' },
        }),
        tx.transaction.create({
          data: { userId, accountId: toAccountId, date, category: 'Transfer', description, amount: encInAmt, type: 'income' },
        }),
      ]);

      // Update both account balances
      await Promise.all([
        tx.account.update({ where: { id: fromAccountId }, data: { balance: encFromBal } }),
        tx.account.update({ where: { id: toAccountId },   data: { balance: encToBal   } }),
      ]);

      return { txOut, txIn, fromBalance: newFromBal, toBalance: newToBal };
    });

    return NextResponse.json({
      transactions: [
        { id: result.txOut.id, accountId: result.txOut.accountId, date, category: 'Transfer', description, amount: -amount, type: 'expense' },
        { id: result.txIn.id,  accountId: result.txIn.accountId,  date, category: 'Transfer', description, amount:  amount, type: 'income'  },
      ],
      fromBalance: result.fromBalance,
      toBalance:   result.toBalance,
    }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e.message === 'Source account not found' || e.message === 'Destination account not found')
      return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

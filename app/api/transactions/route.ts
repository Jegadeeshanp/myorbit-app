import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import type { RecurringConfig } from '@/lib/financeData';

export const runtime = 'nodejs';

async function decryptTx(row: any) {
  return {
    id: row.id, accountId: row.accountId, date: row.date,
    category: row.category, description: row.description, notes: row.notes ?? undefined,
    amount: await decryptNumber(row.amount), type: row.type,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
    return NextResponse.json(await Promise.all(rows.map(decryptTx)));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = transactionSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { accountId, date, category, description, notes, amount, type, recurring } = parsed.data as any;

    // Create the first (or one-off) transaction occurrence
    const row = await prisma.transaction.create({
      data: { userId, accountId, date, category, description, notes: notes ?? null, amount: await encryptNumber(amount), type },
    });

    // If recurring, register a template for future auto-spawning
    if (recurring) {
      const cfg = recurring as RecurringConfig;
      const nextDate = nextFinanceDate(date, cfg.frequency, cfg.customInterval);
      const isExpired = nextDate === null
        || (cfg.endType === 'on_date' && cfg.endDate && nextDate > cfg.endDate)
        || (cfg.endType === 'after' && cfg.endAfterTimes && cfg.endAfterTimes <= 1);

      if (!isExpired && nextDate) {
        await prisma.recurringTransaction.create({
          data: {
            userId,
            accountId: accountId ?? null,
            category,
            description,
            notes: notes ?? null,
            amount: await encryptNumber(amount), // keep original sign
            type,
            recurringConfig: JSON.stringify(cfg),
            nextDate,
            occurrenceCount: 1,
          },
        });
      }
    }

    return NextResponse.json(await decryptTx(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

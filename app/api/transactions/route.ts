import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

async function decryptTx(row: any) {
  return {
    id: row.id, accountId: row.accountId, date: row.date,
    category: row.category, description: row.description,
    amount: await decryptNumber(row.amount), type: row.type,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } });
    const txs = await Promise.all(rows.map(decryptTx));
    return NextResponse.json(txs);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { accountId, date, category, description, amount, type } = parsed.data;
    const row = await prisma.transaction.create({
      data: { userId, accountId, date, category, description, amount: await encryptNumber(amount), type },
    });
    return NextResponse.json(await decryptTx(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

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

    const { accountId: rawAccountId, date, category, description, amount, type } = parsed.data;
    // Normalize empty string to undefined — Prisma FK requires a valid id or null
    const accountId = rawAccountId || undefined;

    // Verify the accountId belongs to this user (prevents spoofing another user's account)
    if (accountId) {
      const acct = await prisma.account.findFirst({ where: { id: accountId, userId } });
      if (!acct) return NextResponse.json({ error: 'Account not found' }, { status: 400 });
    }

    const row = await prisma.transaction.create({
      data: { userId, accountId, date, category, description, amount: await encryptNumber(amount), type },
    });
    return NextResponse.json(await decryptTx(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

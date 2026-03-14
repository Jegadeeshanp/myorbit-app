import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validation';
import { encrypt, decrypt, encryptNumber, decryptNumber } from '@/lib/encryption';

async function decryptAccount(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: await decryptNumber(row.balance),
    creditLimit: row.creditLimit ? await decryptNumber(row.creditLimit) : undefined,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const accounts = await Promise.all(rows.map(decryptAccount));
    return NextResponse.json(accounts);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { name, type, balance, creditLimit } = parsed.data;
    const row = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        balance: await encryptNumber(balance),
        creditLimit: creditLimit != null ? await encryptNumber(creditLimit) : null,
      },
    });
    return NextResponse.json(await decryptAccount(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

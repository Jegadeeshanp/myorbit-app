import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

async function decryptAccount(row: any) {
  return {
    id: row.id, name: row.name, type: row.type,
    balance: await decryptNumber(row.balance),
    creditLimit: row.creditLimit ? await decryptNumber(row.creditLimit) : undefined,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.account.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = accountSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const data: any = { ...parsed.data };
    if (data.balance != null) data.balance = await encryptNumber(data.balance);
    if (data.creditLimit != null) data.creditLimit = await encryptNumber(data.creditLimit);

    const row = await prisma.account.update({ where: { id: params.id }, data });
    return NextResponse.json(await decryptAccount(row));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.account.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.account.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

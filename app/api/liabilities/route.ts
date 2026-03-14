import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { liabilitySchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

async function decryptLiability(row: any) {
  return {
    id: row.id, name: row.name, lender: row.lender ?? undefined,
    nextDueDate: row.nextDueDate ?? undefined, emisLeft: row.emisLeft,
    borrowed: await decryptNumber(row.borrowed),
    outstanding: await decryptNumber(row.outstanding),
    monthlyEmi: await decryptNumber(row.monthlyEmi),
    totalRepaid: await decryptNumber(row.totalRepaid),
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.liability.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(await Promise.all(rows.map(decryptLiability)));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = liabilitySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { name, lender, borrowed, outstanding, monthlyEmi, emisLeft, totalRepaid, nextDueDate } = parsed.data;
    const row = await prisma.liability.create({
      data: {
        userId, name, lender, nextDueDate, emisLeft,
        borrowed: await encryptNumber(borrowed),
        outstanding: await encryptNumber(outstanding),
        monthlyEmi: await encryptNumber(monthlyEmi),
        totalRepaid: await encryptNumber(totalRepaid),
      },
    });
    return NextResponse.json(await decryptLiability(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

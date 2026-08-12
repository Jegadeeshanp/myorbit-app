import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { liabilitySchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

async function decryptLiability(row: any) {
  return {
    id: row.id, name: row.name, lender: row.lender ?? undefined,
    nextDueDate: row.nextDueDate ?? undefined, emisLeft: row.emisLeft,
    repaymentAccountId: row.repaymentAccountId ?? undefined,
    interestRate: row.interestRate ?? undefined,
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
    // Fetch raw fields separately (bypasses stale Prisma client schema)
    const rawIds = await prisma.$queryRaw<{ id: string; repaymentAccountId: string | null; interestRate: number | null }[]>`
      SELECT id, "repaymentAccountId", "interestRate" FROM "Liability" WHERE "userId" = ${userId}
    `;
    const rawMap = Object.fromEntries(rawIds.map(r => [r.id, r]));
    const decrypted = await Promise.all(rows.map(decryptLiability));
    return NextResponse.json(decrypted.map(r => ({
      ...r,
      repaymentAccountId: rawMap[r.id]?.repaymentAccountId ?? undefined,
      interestRate: rawMap[r.id]?.interestRate ?? undefined,
    })));
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

    const { name, lender, borrowed, outstanding, monthlyEmi, emisLeft, totalRepaid, interestRate, nextDueDate, repaymentAccountId } = parsed.data;
    // Create without repaymentAccountId / interestRate (stale Prisma client doesn't know these fields)
    const row = await prisma.liability.create({
      data: {
        userId, name, lender, nextDueDate, emisLeft,
        interestRate: interestRate ?? null,
        borrowed: await encryptNumber(borrowed),
        outstanding: await encryptNumber(outstanding),
        monthlyEmi: await encryptNumber(monthlyEmi),
        totalRepaid: await encryptNumber(totalRepaid),
      },
    });
    // Set raw fields via SQL
    const irVal = interestRate ?? null;
    const repayVal = repaymentAccountId ?? null;
    await prisma.$executeRaw`UPDATE "Liability" SET "interestRate" = ${irVal}, "repaymentAccountId" = ${repayVal} WHERE id = ${row.id}`;
    return NextResponse.json({ ...await decryptLiability(row), interestRate: irVal ?? undefined, repaymentAccountId: repayVal ?? undefined }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

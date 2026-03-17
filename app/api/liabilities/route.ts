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
    // Fetch repaymentAccountId separately (bypasses stale Prisma client schema)
    const rawIds = await prisma.$queryRaw<{ id: string; repaymentAccountId: string | null }[]>`
      SELECT id, "repaymentAccountId" FROM "Liability" WHERE "userId" = ${userId}
    `;
    const repayMap = Object.fromEntries(rawIds.map(r => [r.id, r.repaymentAccountId ?? undefined]));
    const decrypted = await Promise.all(rows.map(decryptLiability));
    return NextResponse.json(decrypted.map(r => ({ ...r, repaymentAccountId: repayMap[r.id] })));
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

    const { name, lender, borrowed, outstanding, monthlyEmi, emisLeft, totalRepaid, nextDueDate, repaymentAccountId } = parsed.data;
    // Create without repaymentAccountId (old Prisma client doesn't know this field yet)
    const row = await prisma.liability.create({
      data: {
        userId, name, lender, nextDueDate, emisLeft,
        borrowed: await encryptNumber(borrowed),
        outstanding: await encryptNumber(outstanding),
        monthlyEmi: await encryptNumber(monthlyEmi),
        totalRepaid: await encryptNumber(totalRepaid),
      },
    });
    // Set repaymentAccountId via raw SQL (bypasses stale Prisma client schema)
    if (repaymentAccountId) {
      await prisma.$executeRaw`UPDATE "Liability" SET "repaymentAccountId" = ${repaymentAccountId} WHERE id = ${row.id}`;
    }
    return NextResponse.json({ ...await decryptLiability(row), repaymentAccountId: repaymentAccountId ?? undefined }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

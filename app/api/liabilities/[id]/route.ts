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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.liability.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parsed = liabilitySchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const data: any = { ...parsed.data };
    // Extract repaymentAccountId before passing to Prisma (old client doesn't know this field yet)
    const repaymentAccountId = data.repaymentAccountId as string | undefined;
    delete data.repaymentAccountId;

    for (const f of ['borrowed', 'outstanding', 'monthlyEmi', 'totalRepaid'] as const) {
      if (data[f] != null) data[f] = await encryptNumber(data[f]);
    }

    const row = await prisma.liability.update({ where: { id }, data });

    // Update repaymentAccountId via raw SQL if it was included in the request
    if ('repaymentAccountId' in parsed.data) {
      const val = repaymentAccountId ?? null;
      await prisma.$executeRaw`UPDATE "Liability" SET "repaymentAccountId" = ${val} WHERE id = ${id}`;
    }

    // Fetch the current repaymentAccountId from DB (raw) and merge into response
    const [raw] = await prisma.$queryRaw<{ repaymentAccountId: string | null }[]>`
      SELECT "repaymentAccountId" FROM "Liability" WHERE id = ${id}
    `;
    return NextResponse.json({ ...await decryptLiability(row), repaymentAccountId: raw?.repaymentAccountId ?? undefined });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.liability.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.liability.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

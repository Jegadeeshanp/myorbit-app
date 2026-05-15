import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function DELETE() {
  try {
    const userId = await requireUserId();

    // Delete all finance-related data for this user in dependency order
    await prisma.$transaction([
      prisma.investmentTransaction.deleteMany({ where: { userId } }),
      prisma.recurringTransaction.deleteMany({ where: { userId } }),
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.budget.deleteMany({ where: { userId } }),
      prisma.asset.deleteMany({ where: { userId } }),
      prisma.liability.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

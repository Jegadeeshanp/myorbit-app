// app/api/net-worth/route.ts
import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();

    const [assets, liabilities, accounts] = await Promise.all([
      prisma.asset.findMany({ where: { userId } }),
      prisma.liability.findMany({ where: { userId } }),
      prisma.account.findMany({ where: { userId } }),
    ]);

    // All monetary fields are encrypted strings — decrypt before summing
    const assetTotal = (
      await Promise.all(assets.map((a) => decryptNumber(a.value)))
    ).reduce((sum, v) => sum + v, 0);

    const liabilityTotal = (
      await Promise.all(liabilities.map((l) => decryptNumber(l.outstanding)))
    ).reduce((sum, v) => sum + v, 0);

    const accountTotal = (
      await Promise.all(accounts.map((a) => decryptNumber(a.balance)))
    ).reduce((sum, v) => sum + v, 0);

    const netWorth = assetTotal + accountTotal - liabilityTotal;

    return NextResponse.json({
      netWorth,
      breakdown: {
        totalAssets: assetTotal,
        totalAccountBalance: accountTotal,
        totalLiabilities: liabilityTotal,
        assetCount: assets.length,
        liabilityCount: liabilities.length,
        accountCount: accounts.length,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

/** Compute invested from InvestmentTransaction rows (LUMPSUM + SIP only). */
async function computeInvested(assetId: string): Promise<number> {
  const rows = await prisma.investmentTransaction.findMany({
    where: { assetId, type: { in: ['LUMPSUM', 'SIP'] } },
  });
  if (rows.length === 0) return 0;
  return (await Promise.all(rows.map(r => decryptNumber(r.amount)))).reduce((s, v) => s + v, 0);
}

async function decryptAsset(row: any, extra?: { accountId?: string | null; investmentType?: string; sipConfig?: string | null; units?: number | null }) {
  // Prefer computed invested from InvestmentTransaction; fall back to stored field
  const computedInvested = await computeInvested(row.id);
  const storedInvested   = await decryptNumber(row.invested);

  return {
    id:             row.id,
    name:           row.name,
    category:       row.category,
    units:          extra?.units ?? (row as any).units ?? null,
    value:          await decryptNumber(row.value),
    invested:       computedInvested > 0 ? computedInvested : storedInvested,
    accountId:      extra?.accountId ?? undefined,
    investmentType: (extra?.investmentType ?? 'lump_sum') as 'lump_sum' | 'sip',
    sipConfig:      extra?.sipConfig ? JSON.parse(extra.sipConfig) : null,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });

    let extras: { id: string; accountId: string | null; investmentType: string; sipConfig: string | null; units?: number | null }[] = [];
    try {
      extras = await prisma.$queryRaw`
        SELECT id, "accountId", "investmentType", "sipConfig", "units" FROM "Asset" WHERE "userId" = ${userId}
      `;
    } catch {
      extras = await prisma.$queryRaw`
        SELECT id, "accountId", "investmentType", "sipConfig" FROM "Asset" WHERE "userId" = ${userId}
      `;
    }
    const extraMap = Object.fromEntries(extras.map(e => [e.id, e]));

    const decrypted = await Promise.all(rows.map(r => decryptAsset(r, extraMap[r.id])));
    return NextResponse.json(decrypted);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = assetSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { name, category, value, invested, accountId, investmentType, sipConfig } = parsed.data;
    const { units } = parsed.data as any;

    const row = await prisma.asset.create({
      data: { userId, name, category, value: await encryptNumber(value), invested: await encryptNumber(invested), units: units ?? null },
    });

    const invType = investmentType ?? 'lump_sum';
    const sipVal  = sipConfig == null ? null : typeof sipConfig === 'string' ? sipConfig : JSON.stringify(sipConfig);
    const accVal  = accountId ?? null;

    await prisma.$executeRaw`
      UPDATE "Asset" SET "accountId" = ${accVal}, "investmentType" = ${invType}, "sipConfig" = ${sipVal}
      WHERE id = ${row.id}
    `;

    // Create initial InvestmentTransaction (LUMPSUM) so invested is tracked properly
    if (invested > 0) {
      await prisma.investmentTransaction.create({
        data: {
          assetId: row.id,
          userId,
          type: 'LUMPSUM',
          amount: await encryptNumber(invested),
          date: new Date().toLocaleDateString('en-CA'),
          note: 'Initial investment',
        },
      });
    }

    // ── Funding transaction (account-linked assets only) ──────────────────
    // Single source of truth — no client-side duplication.
    // Guard: only for account-linked assets with a positive invested amount.
    let fundingTransaction: any = null;
    let updatedAccount: any = null;

    if (accVal && invested > 0) {
      const today = new Date().toLocaleDateString('en-CA');

      // Idempotency: skip if a funding transaction for this asset already exists today
      const existing = await prisma.transaction.findFirst({
        where: { userId, accountId: accVal, category: 'Investment', description: name, date: today },
      });

      if (!existing) {
        fundingTransaction = await prisma.transaction.create({
          data: {
            userId,
            accountId: accVal,
            date: today,
            category: 'Investment',
            description: name,
            amount: await encryptNumber(-Math.abs(invested)),
            type: 'expense',
          },
        });
        // Decrypt amount for client
        fundingTransaction = {
          ...fundingTransaction,
          amount: -Math.abs(invested),
        };

        // Deduct from linked account balance
        const accRow = await prisma.account.findFirst({ where: { id: accVal, userId } });
        if (accRow) {
          const currentBalance = await decryptNumber(accRow.balance);
          const newBalance     = currentBalance - Math.abs(invested);
          const updated        = await prisma.account.update({
            where: { id: accVal },
            data:  { balance: await encryptNumber(newBalance) },
          });
          updatedAccount = { id: updated.id, name: updated.name, type: updated.type, balance: newBalance };
          if (updated.creditLimit) updatedAccount.creditLimit = await decryptNumber(updated.creditLimit);
        }
      }
    }

    const asset = await decryptAsset(row, { accountId: accVal, investmentType: invType, sipConfig: sipVal, units });
    return NextResponse.json({ asset, fundingTransaction, updatedAccount }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

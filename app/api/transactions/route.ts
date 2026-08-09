import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { nextFinanceDate } from '@/lib/financeRecurrence';
import { applyTransactionBalanceDelta } from '@/lib/financeBalance';
import type { RecurringConfig } from '@/lib/financeData';

export const runtime = 'nodejs';

async function decryptTx(row: any, linkedAssetId?: string | null, linkedLiabilityId?: string | null) {
  return {
    id: row.id, accountId: row.accountId, date: row.date,
    category: row.category, description: row.description, notes: row.notes ?? undefined,
    amount: await decryptNumber(row.amount), type: row.type,
    linkedAssetId: linkedAssetId ?? undefined,
    linkedLiabilityId: linkedLiabilityId ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId') || undefined;
    const month = searchParams.get('month') || undefined;
    const rows = await prisma.transaction.findMany({
      where: {
        userId,
        ...(accountId ? { accountId } : {}),
        ...(month ? { date: { startsWith: month } } : {}),
      },
      orderBy: { date: 'desc' },
    });

    // Fetch linked fields via raw SQL (columns added via migration, not in Prisma client)
    let linkMap: Record<string, { linkedAssetId: string | null; linkedLiabilityId: string | null }> = {};
    try {
      const links = await prisma.$queryRaw<{ id: string; linkedAssetId: string | null; linkedLiabilityId: string | null }[]>`
        SELECT id, "linkedAssetId", "linkedLiabilityId" FROM "Transaction" WHERE "userId" = ${userId}
      `;
      linkMap = Object.fromEntries(links.map(l => [l.id, l]));
    } catch { /* columns may not exist yet */ }

    return NextResponse.json(
      await Promise.all(rows.map(r => decryptTx(r, linkMap[r.id]?.linkedAssetId, linkMap[r.id]?.linkedLiabilityId)))
    );
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

    const { accountId, date, category, description, notes, amount, type, recurring, linkedAssetId, linkedLiabilityId } = parsed.data as any;

    if (accountId) {
      const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
      if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Validate linked entity ownership upfront
    if (linkedAssetId) {
      const asset = await prisma.asset.findFirst({ where: { id: linkedAssetId, userId } });
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    if (linkedLiabilityId) {
      const liability = await prisma.liability.findFirst({ where: { id: linkedLiabilityId, userId } });
      if (!liability) return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    // Create the transaction
    const row = await prisma.transaction.create({
      data: { userId, accountId, date, category, description, notes: notes ?? null, amount: await encryptNumber(amount), type },
    });

    // Set linked fields via raw SQL
    if (linkedAssetId || linkedLiabilityId) {
      await prisma.$executeRaw`
        UPDATE "Transaction"
        SET "linkedAssetId" = ${linkedAssetId ?? null}, "linkedLiabilityId" = ${linkedLiabilityId ?? null}
        WHERE id = ${row.id}
      `;
    }

    if (accountId) {
      await applyTransactionBalanceDelta(userId, { accountId, date, amount, type });
    }

    // If recurring, register a template
    if (recurring) {
      const cfg = recurring as RecurringConfig;
      const nextDate = nextFinanceDate(date, cfg.frequency, cfg.customInterval);
      const isExpired = nextDate === null
        || (cfg.endType === 'on_date' && cfg.endDate && nextDate > cfg.endDate)
        || (cfg.endType === 'after' && cfg.endAfterTimes && cfg.endAfterTimes <= 1);
      if (!isExpired && nextDate) {
        await prisma.recurringTransaction.create({
          data: {
            userId, accountId: accountId ?? null, category, description, notes: notes ?? null,
            amount: await encryptNumber(amount), type, recurringConfig: JSON.stringify(cfg),
            nextDate, occurrenceCount: 1,
          },
        });
      }
    }

    // ── SIP side-effect: record InvestmentTransaction + update asset.invested ──
    let updatedAsset: any = undefined;
    if (linkedAssetId) {
      const paymentAmt = Math.abs(amount);
      await prisma.investmentTransaction.create({
        data: {
          assetId: linkedAssetId, userId, type: 'SIP',
          amount: await encryptNumber(paymentAmt),
          date, note: description || 'SIP installment',
        },
      });
      // Recompute invested
      const itRows = await prisma.investmentTransaction.findMany({
        where: { assetId: linkedAssetId, type: { in: ['LUMPSUM', 'SIP'] } },
      });
      const newInvested = (await Promise.all(itRows.map(r => decryptNumber(r.amount)))).reduce((s, v) => s + v, 0);
      await prisma.asset.update({ where: { id: linkedAssetId }, data: { invested: await encryptNumber(newInvested) } });

      const assetRow = await prisma.asset.findFirst({ where: { id: linkedAssetId } });
      const [rawAsset] = await prisma.$queryRaw<{ symbol: string | null; units: number | null; investmentType: string; sipConfig: string | null; accountId: string | null }[]>`
        SELECT symbol, units, "investmentType", "sipConfig", "accountId" FROM "Asset" WHERE id = ${linkedAssetId}
      `;
      updatedAsset = {
        id: assetRow!.id, name: assetRow!.name, category: assetRow!.category,
        value: await decryptNumber(assetRow!.value),
        invested: newInvested,
        symbol: rawAsset?.symbol ?? undefined,
        units: rawAsset?.units ?? undefined,
        accountId: rawAsset?.accountId ?? undefined,
        investmentType: rawAsset?.investmentType ?? 'lump_sum',
        sipConfig: rawAsset?.sipConfig ? JSON.parse(rawAsset.sipConfig) : null,
      };
    }

    // ── EMI side-effect: update liability outstanding/repaid/emisLeft ──────────
    let updatedLiability: any = undefined;
    if (linkedLiabilityId) {
      const liability = await prisma.liability.findFirst({ where: { id: linkedLiabilityId, userId } });
      if (liability) {
        const [rawLib] = await prisma.$queryRaw<{ interestRate: number | null }[]>`
          SELECT "interestRate" FROM "Liability" WHERE id = ${linkedLiabilityId}
        `;
        const interestRate = rawLib?.interestRate ?? 0;
        const outstanding  = await decryptNumber(liability.outstanding);
        const totalRepaid  = await decryptNumber(liability.totalRepaid);
        const borrowed     = await decryptNumber(liability.borrowed);
        const monthlyEmi   = await decryptNumber(liability.monthlyEmi);

        const paymentAmt = Math.abs(amount);
        const interest = interestRate > 0
          ? Math.round(outstanding * (interestRate / 100 / 12) * 100) / 100
          : 0;
        const principalPaid = Math.max(0, paymentAmt - interest);
        const newOutstanding = Math.max(0, outstanding - principalPaid);
        const newTotalRepaid = totalRepaid + paymentAmt;
        const newEmisLeft    = Math.max(0, liability.emisLeft - 1);

        const d = new Date(liability.nextDueDate ?? Date.now());
        d.setMonth(d.getMonth() + 1);
        const newNextDueDate = d.toLocaleDateString('en-CA');

        await prisma.liability.update({
          where: { id: linkedLiabilityId },
          data: {
            outstanding: await encryptNumber(newOutstanding),
            totalRepaid: await encryptNumber(newTotalRepaid),
            emisLeft: newEmisLeft,
            nextDueDate: newNextDueDate,
          },
        });

        updatedLiability = {
          id: liability.id, name: liability.name, lender: liability.lender ?? undefined,
          borrowed, outstanding: newOutstanding, monthlyEmi,
          emisLeft: newEmisLeft, totalRepaid: newTotalRepaid,
          nextDueDate: newNextDueDate,
          interestRate: interestRate || undefined,
          repaymentAccountId: liability.repaymentAccountId ?? undefined,
        };
      }
    }

    const transaction = await decryptTx(row, linkedAssetId, linkedLiabilityId);
    return NextResponse.json({ transaction, updatedAsset, updatedLiability }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

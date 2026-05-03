import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { nextFinanceDate } from '@/lib/financeRecurrence';

export const runtime = 'nodejs';

async function computeInvested(assetId: string): Promise<number> {
  const rows = await prisma.investmentTransaction.findMany({
    where: { assetId, type: { in: ['LUMPSUM', 'SIP'] } },
  });
  if (rows.length === 0) return 0;
  return (await Promise.all(rows.map(r => decryptNumber(r.amount)))).reduce((s, v) => s + v, 0);
}

async function decryptAsset(row: any, extra?: { accountId?: string | null; investmentType?: string; sipConfig?: string | null }) {
  const computedInvested = await computeInvested(row.id);
  const storedInvested   = await decryptNumber(row.invested);
  return {
    id: row.id, name: row.name, category: row.category,
    units: row.units ?? null,
    value: await decryptNumber(row.value),
    invested: computedInvested > 0 ? computedInvested : storedInvested,
    accountId: extra?.accountId ?? undefined,
    investmentType: (extra?.investmentType ?? 'lump_sum') as 'lump_sum' | 'sip',
    sipConfig: extra?.sipConfig ? JSON.parse(extra.sipConfig) : null,
  };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const row = await prisma.asset.findFirst({ where: { id, userId } });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const [extra] = await prisma.$queryRaw<any[]>`
      SELECT id, "accountId", "investmentType", "sipConfig", "units" FROM "Asset" WHERE id = ${id}
    `;
    return NextResponse.json(await decryptAsset(row, extra));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.asset.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parsed = assetSchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { accountId, investmentType, sipConfig, ...coreData } = parsed.data as any;

    const data: any = { ...coreData };
    if (data.value != null) data.value = await encryptNumber(data.value);
    if (data.invested != null) data.invested = await encryptNumber(data.invested);
    if ('units' in coreData) data.units = coreData.units ?? null;

    const row = await prisma.asset.update({ where: { id }, data });

    if ('accountId' in parsed.data || 'investmentType' in parsed.data || 'sipConfig' in parsed.data) {
      const accVal  = accountId ?? null;
      const invType = investmentType ?? 'lump_sum';
      const sipVal  = sipConfig == null ? null : typeof sipConfig === 'string' ? sipConfig : JSON.stringify(sipConfig);
      await prisma.$executeRaw`
        UPDATE "Asset" SET "accountId" = ${accVal}, "investmentType" = ${invType}, "sipConfig" = ${sipVal}
        WHERE id = ${id}
      `;
    }

    const [extra] = await prisma.$queryRaw<{ accountId: string | null; investmentType: string; sipConfig: string | null }[]>`
      SELECT "accountId", "investmentType", "sipConfig" FROM "Asset" WHERE id = ${id}
    `;

    // ── SIP: create any new past installments not yet recorded ────────────────
    const sipTransactions: any[] = [];
    let sipUpdatedAccount: any = null;

    if (extra.investmentType === 'sip' && extra.accountId && extra.sipConfig) {
      const sipParsed = JSON.parse(extra.sipConfig);
      const sipAmt = Number(sipParsed?.amount);

      if (sipAmt > 0) {
        const today = new Date().toLocaleDateString('en-CA');

        // Find the last already-processed SIP installment for this asset
        const lastInvTx = await prisma.investmentTransaction.findFirst({
          where: { assetId: id, userId, type: 'SIP' },
          orderBy: { date: 'desc' },
        });

        // Start from sipStart, or the next occurrence after the last recorded one
        let current = sipParsed.startDate as string;
        if (lastInvTx) {
          const nextAfterLast = nextFinanceDate(lastInvTx.date, sipParsed.frequency as any);
          if (nextAfterLast && nextAfterLast > current) current = nextAfterLast;
        }

        let occCount = 0;
        const MAX = 120;

        while (current <= today && occCount < MAX) {
          if (sipParsed.endType === 'after' && sipParsed.endAfterTimes && occCount >= sipParsed.endAfterTimes) break;
          if (sipParsed.endType === 'on_date' && sipParsed.endDate && current > sipParsed.endDate) break;

          const tx = await prisma.transaction.create({
            data: {
              userId,
              accountId: extra.accountId,
              date: current,
              category: 'Investment',
              description: `SIP – ${row.name}`,
              amount: await encryptNumber(-sipAmt),
              type: 'expense',
            },
          });
          sipTransactions.push({ ...tx, amount: -sipAmt });

          await prisma.investmentTransaction.create({
            data: { assetId: id, userId, type: 'SIP', amount: await encryptNumber(sipAmt), date: current, note: 'SIP installment' },
          });

          occCount++;
          const next = nextFinanceDate(current, sipParsed.frequency as any);
          if (!next || next === current) break;
          current = next;
        }

        // Deduct total new amount from account
        if (occCount > 0) {
          const accRow = await prisma.account.findFirst({ where: { id: extra.accountId, userId } });
          if (accRow) {
            const newBalance = await decryptNumber(accRow.balance) - sipAmt * occCount;
            const updated = await prisma.account.update({ where: { id: extra.accountId }, data: { balance: await encryptNumber(newBalance) } });
            sipUpdatedAccount = { id: updated.id, name: updated.name, type: updated.type, balance: newBalance };
            if (updated.creditLimit) sipUpdatedAccount.creditLimit = await decryptNumber(updated.creditLimit);
          }
        }

        // Rebuild RecurringTransaction template with correct next future date
        await prisma.recurringTransaction.deleteMany({ where: { assetId: id, type: 'SIP', userId } });
        const totalExistingCount = lastInvTx
          ? (await prisma.investmentTransaction.count({ where: { assetId: id, userId, type: 'SIP' } }))
          : occCount;
        const recurringCfg = { frequency: sipParsed.frequency, startDate: sipParsed.startDate, endType: sipParsed.endType, endAfterTimes: sipParsed.endAfterTimes, endDate: sipParsed.endDate };
        await prisma.recurringTransaction.create({
          data: {
            userId,
            assetId:         id,
            accountId:       extra.accountId,
            category:        'Investment',
            description:     row.name,
            amount:          await encryptNumber(-sipAmt),
            type:            'SIP',
            recurringConfig: JSON.stringify(recurringCfg),
            nextDate:        current,
            occurrenceCount: totalExistingCount,
          },
        });
      }
    } else {
      // No SIP or no account — just clean up any orphaned template
      await prisma.recurringTransaction.deleteMany({ where: { assetId: id, type: 'SIP', userId } });
    }

    const asset = await decryptAsset(row, extra);
    return NextResponse.json({ ...asset, sipTransactions, sipUpdatedAccount });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.asset.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { applyTransactionBalanceDelta } from '@/lib/financeBalance';

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

async function getLinkedFields(id: string) {
  try {
    const [r] = await prisma.$queryRaw<{ linkedAssetId: string | null; linkedLiabilityId: string | null }[]>`
      SELECT "linkedAssetId", "linkedLiabilityId" FROM "Transaction" WHERE id = ${id}
    `;
    return { linkedAssetId: r?.linkedAssetId ?? null, linkedLiabilityId: r?.linkedLiabilityId ?? null };
  } catch { return { linkedAssetId: null, linkedLiabilityId: null }; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const parsed = transactionSchema.partial().safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const existingAmount = await decryptNumber(existing.amount);
    const data: any = { ...parsed.data };
    delete data.linkedAssetId;
    delete data.linkedLiabilityId;
    if (data.accountId) {
      const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
      if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    if (data.amount != null) data.amount = await encryptNumber(data.amount);

    const row = await prisma.transaction.update({ where: { id }, data });
    // Reverse old balance effect, then apply new one. Track the final affected account.
    await applyTransactionBalanceDelta(userId, { accountId: existing.accountId, date: existing.date, amount: existingAmount, type: existing.type }, -1);
    const updatedAccount = await applyTransactionBalanceDelta(userId, { accountId: row.accountId, date: row.date, amount: await decryptNumber(row.amount), type: row.type }) ?? undefined;

    const { linkedAssetId, linkedLiabilityId } = await getLinkedFields(id);
    return NextResponse.json({ transaction: await decryptTx(row, linkedAssetId, linkedLiabilityId), updatedAccount });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const existingAmount = await decryptNumber(existing.amount);
    const { linkedAssetId, linkedLiabilityId } = await getLinkedFields(id);

    await prisma.transaction.delete({ where: { id } });
    const updatedAccount = await applyTransactionBalanceDelta(userId, { accountId: existing.accountId, date: existing.date, amount: existingAmount, type: existing.type }, -1) ?? undefined;

    // ── Reverse SIP: delete matching InvestmentTransaction + recompute invested ──
    let updatedAsset: any = undefined;
    if (linkedAssetId) {
      const paymentAmt = Math.abs(existingAmount);
      const encAmt = await encryptNumber(paymentAmt);
      // Find a SIP InvestmentTransaction with the same date and amount to delete
      const match = await prisma.investmentTransaction.findFirst({
        where: { assetId: linkedAssetId, userId, type: 'SIP', date: existing.date, amount: encAmt },
      });
      if (match) await prisma.investmentTransaction.delete({ where: { id: match.id } });

      // Recompute invested
      const itRows = await prisma.investmentTransaction.findMany({
        where: { assetId: linkedAssetId, type: { in: ['LUMPSUM', 'SIP'] } },
      });
      const newInvested = (await Promise.all(itRows.map(r => decryptNumber(r.amount)))).reduce((s, v) => s + v, 0);
      await prisma.asset.update({ where: { id: linkedAssetId }, data: { invested: await encryptNumber(newInvested) } });

      const assetRow = await prisma.asset.findFirst({ where: { id: linkedAssetId } });
      if (assetRow) {
        const [rawAsset] = await prisma.$queryRaw<{ symbol: string | null; units: number | null; investmentType: string; sipConfig: string | null; accountId: string | null }[]>`
          SELECT symbol, units, "investmentType", "sipConfig", "accountId" FROM "Asset" WHERE id = ${linkedAssetId}
        `;
        updatedAsset = {
          id: assetRow.id, name: assetRow.name, category: assetRow.category,
          value: await decryptNumber(assetRow.value), invested: newInvested,
          symbol: rawAsset?.symbol ?? undefined, units: rawAsset?.units ?? undefined,
          accountId: rawAsset?.accountId ?? undefined,
          investmentType: rawAsset?.investmentType ?? 'lump_sum',
          sipConfig: rawAsset?.sipConfig ? JSON.parse(rawAsset.sipConfig) : null,
        };
      }
    }

    // ── Reverse EMI: add back payment to outstanding, subtract from totalRepaid ─
    let updatedLiability: any = undefined;
    if (linkedLiabilityId) {
      const liability = await prisma.liability.findFirst({ where: { id: linkedLiabilityId, userId } });
      if (liability) {
        const paymentAmt = Math.abs(existingAmount);
        const outstanding = await decryptNumber(liability.outstanding);
        const totalRepaid = await decryptNumber(liability.totalRepaid);
        const borrowed    = await decryptNumber(liability.borrowed);
        const monthlyEmi  = await decryptNumber(liability.monthlyEmi);
        const [rawLib]    = await prisma.$queryRaw<{ interestRate: number | null }[]>`
          SELECT "interestRate" FROM "Liability" WHERE id = ${linkedLiabilityId}
        `;

        const newOutstanding = Math.min(borrowed, outstanding + paymentAmt);
        const newTotalRepaid = Math.max(0, totalRepaid - paymentAmt);
        const newEmisLeft    = liability.emisLeft + 1;

        await prisma.liability.update({
          where: { id: linkedLiabilityId },
          data: {
            outstanding: await encryptNumber(newOutstanding),
            totalRepaid: await encryptNumber(newTotalRepaid),
            emisLeft: newEmisLeft,
          },
        });

        updatedLiability = {
          id: liability.id, name: liability.name, lender: liability.lender ?? undefined,
          borrowed, outstanding: newOutstanding, monthlyEmi,
          emisLeft: newEmisLeft, totalRepaid: newTotalRepaid,
          nextDueDate: liability.nextDueDate ?? undefined,
          interestRate: rawLib?.interestRate ?? undefined,
          repaymentAccountId: liability.repaymentAccountId ?? undefined,
        };
      }
    }

    return NextResponse.json({ ok: true, updatedAsset, updatedLiability, updatedAccount });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

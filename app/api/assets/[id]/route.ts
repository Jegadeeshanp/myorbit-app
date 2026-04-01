import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

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

    // Extract new fields before Prisma update (old client doesn't know them)
    const { accountId, investmentType, sipConfig, ...coreData } = parsed.data as any;

    const data: any = { ...coreData };
    if (data.value != null) data.value = await encryptNumber(data.value);
    if (data.invested != null) data.invested = await encryptNumber(data.invested);
    if ('units' in coreData) data.units = coreData.units ?? null;

    const row = await prisma.asset.update({ where: { id }, data });

    // Update new fields via raw SQL if they were included in the request
    if ('accountId' in parsed.data || 'investmentType' in parsed.data || 'sipConfig' in parsed.data) {
      const accVal = accountId ?? null;
      const invType = investmentType ?? 'lump_sum';
      const sipConfigRaw = sipConfig;
      const sipVal = sipConfigRaw == null
        ? null
        : typeof sipConfigRaw === 'string'
          ? sipConfigRaw
          : JSON.stringify(sipConfigRaw);
      await prisma.$executeRaw`
        UPDATE "Asset" SET "accountId" = ${accVal}, "investmentType" = ${invType}, "sipConfig" = ${sipVal}
        WHERE id = ${id}
      `;
    }

    // Fetch current new fields from DB to merge into response
    const [extra] = await prisma.$queryRaw<{ accountId: string | null; investmentType: string; sipConfig: string | null }[]>`
      SELECT "accountId", "investmentType", "sipConfig" FROM "Asset" WHERE id = ${id}
    `;

    return NextResponse.json(await decryptAsset(row, extra));
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

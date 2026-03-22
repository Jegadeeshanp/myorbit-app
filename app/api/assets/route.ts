import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

async function decryptAsset(row: any, extra?: { accountId?: string | null; investmentType?: string; sipConfig?: string | null }) {
  return {
    id: row.id, name: row.name, category: row.category,
    units: (extra as any)?.units ?? (row as any).units ?? null,
    value: await decryptNumber(row.value),
    invested: await decryptNumber(row.invested),
    accountId: extra?.accountId ?? undefined,
    investmentType: (extra?.investmentType ?? 'lump_sum') as 'lump_sum' | 'sip',
    sipConfig: extra?.sipConfig ? JSON.parse(extra.sipConfig) : null,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });

    // Fetch new fields via raw SQL — safely handle units column that may not exist yet
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

    // Create without new fields (old Prisma client doesn't know them)
    const { units } = parsed.data as any;
    const row = await prisma.asset.create({
      data: { userId, name, category, value: await encryptNumber(value), invested: await encryptNumber(invested), units: units ?? null },
    });

    // Set new fields via raw SQL
    const invType = investmentType ?? 'lump_sum';
    const sipConfigRaw = sipConfig;
    const sipVal = sipConfigRaw == null
      ? null
      : typeof sipConfigRaw === 'string'
        ? sipConfigRaw
        : JSON.stringify(sipConfigRaw);
    const accVal = accountId ?? null;
    await prisma.$executeRaw`
      UPDATE "Asset" SET "accountId" = ${accVal}, "investmentType" = ${invType}, "sipConfig" = ${sipVal}
      WHERE id = ${row.id}
    `;

    return NextResponse.json(await decryptAsset(row, { accountId: accVal, investmentType: invType, sipConfig: sipVal }), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
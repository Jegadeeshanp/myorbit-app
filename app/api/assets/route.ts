import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema } from '@/lib/validation';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

async function decryptAsset(row: any) {
  return {
    id: row.id, name: row.name, category: row.category,
    value: await decryptNumber(row.value),
    invested: await decryptNumber(row.invested),
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(await Promise.all(rows.map(decryptAsset)));
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

    const { name, category, value, invested } = parsed.data;
    const row = await prisma.asset.create({
      data: { userId, name, category, value: await encryptNumber(value), invested: await encryptNumber(invested) },
    });
    return NextResponse.json(await decryptAsset(row), { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// One-shot migration: adds linkedAssetId and linkedLiabilityId to Transaction.
// Call once then this file can be deleted.
export async function POST() {
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Transaction"
      ADD COLUMN IF NOT EXISTS "linkedAssetId"     TEXT,
      ADD COLUMN IF NOT EXISTS "linkedLiabilityId" TEXT
    `;
    return NextResponse.json({ ok: true, message: 'Columns added (or already existed)' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

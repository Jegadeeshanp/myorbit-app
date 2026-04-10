import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';
import { z } from 'zod';

export const runtime = 'nodejs';

const patchSchema = z.object({
  description:     z.string().min(1).max(200).optional(),
  category:        z.string().min(1).max(100).optional(),
  notes:           z.string().max(500).nullable().optional(),
  amount:          z.number().optional(), // plain number — will be encrypted
  type:            z.enum(['expense', 'income', 'SIP']).optional(),
  nextDate:        z.string().optional(),
  recurringConfig: z.any().optional(), // RecurringConfig object — will be JSON-stringified
});

/** PATCH /api/recurring-transactions/:id — update a recurring template */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const row = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { amount, recurringConfig, ...rest } = parsed.data;
    const dbUpdate: Record<string, any> = { ...rest };
    if (amount !== undefined) dbUpdate.amount = await encryptNumber(amount);
    if (recurringConfig !== undefined) dbUpdate.recurringConfig = JSON.stringify(recurringConfig);

    const updated = await prisma.recurringTransaction.update({ where: { id }, data: dbUpdate });

    // Return decrypted form matching RecurringTemplate shape
    return NextResponse.json({
      id: updated.id,
      accountId: updated.accountId ?? undefined,
      assetId: updated.assetId ?? undefined,
      category: updated.category,
      description: updated.description,
      notes: updated.notes ?? undefined,
      amount: await decryptNumber(updated.amount),
      type: updated.type,
      recurringConfig: JSON.parse(updated.recurringConfig),
      nextDate: updated.nextDate,
      occurrenceCount: updated.occurrenceCount,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** DELETE /api/recurring-transactions/:id — cancel a recurring template */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const row = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.recurringTransaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

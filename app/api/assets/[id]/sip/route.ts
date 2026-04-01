import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber } from '@/lib/encryption';
import { z } from 'zod';

export const runtime = 'nodejs';

const sipSchema = z.object({
  amount:     z.number().positive(),
  dayOfMonth: z.number().int().min(1).max(28),
  accountId:  z.string().optional(),
  note:       z.string().optional(),
});

/** Compute the next occurrence date for a given day-of-month.
 *  If dayOfMonth > today's date → use this month.
 *  Otherwise → use next month (always future).
 */
function nextSipDate(dayOfMonth: number): string {
  const now   = new Date();
  const today = now.getDate();
  let year  = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (dayOfMonth <= today) {
    // This month's date has passed — schedule for next month
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  // Clamp to last day of month (e.g. Feb 28)
  const maxDay = new Date(year, month + 1, 0).getDate();
  const day    = Math.min(dayOfMonth, maxDay);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId      = await requireUserId();
    const { id: assetId } = await params;

    // Verify asset belongs to user
    const asset = await prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const parsed = sipSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { amount, dayOfMonth, accountId, note } = parsed.data;

    // Check if a SIP template already exists for this asset; cancel it before creating new one
    await prisma.recurringTransaction.deleteMany({
      where: { userId, assetId, type: 'SIP' },
    });

    const nextDate = nextSipDate(dayOfMonth);
    const recurringConfig = JSON.stringify({
      frequency:  'monthly',
      startDate:  nextDate,
      endType:    'never',
      dayOfMonth, // store so we can display it in UI
    });

    const template = await prisma.recurringTransaction.create({
      data: {
        userId,
        assetId,
        accountId: accountId ?? null,
        category:    'Investment',
        description: `SIP – ${asset.name}`,
        notes:       note ?? null,
        amount:      await encryptNumber(amount),
        type:        'SIP',
        recurringConfig,
        nextDate,
        occurrenceCount: 0,
      },
    });

    return NextResponse.json({ ok: true, templateId: template.id, nextDate }, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId          = await requireUserId();
    const { id: assetId } = await params;

    await prisma.recurringTransaction.deleteMany({
      where: { userId, assetId, type: 'SIP' },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

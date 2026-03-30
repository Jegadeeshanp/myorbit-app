import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * POST /api/tasks/:id/snooze?minutes=15
 * Stores `snoozed-until:HH:MM` (IST) in the task tags.
 * The cron job /api/cron/reminders picks this up and re-sends the notification.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    const minutes = parseInt(new URL(req.url).searchParams.get('minutes') || '15');

    const task = await prisma.task.findFirst({ where: { id, userId }, select: { tags: true } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Compute target IST time string HH:MM
    const targetMs = Date.now() + minutes * 60 * 1000;
    const targetTime = new Date(targetMs).toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }); // e.g. "14:30"

    const tags: string[] = (() => { try { return JSON.parse(task.tags || '[]'); } catch { return []; } })();
    const cleaned = tags.filter(t => !t.startsWith('snoozed-until:'));
    cleaned.push(`snoozed-until:${targetTime}`);

    await prisma.task.update({ where: { id }, data: { tags: JSON.stringify(cleaned) } });
    return NextResponse.json({ ok: true, snoozedUntil: targetTime });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

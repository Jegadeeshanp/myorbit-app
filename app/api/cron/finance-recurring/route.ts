/**
 * app/api/cron/finance-recurring/route.ts
 * Daily cron — processes overdue recurring templates for ALL users.
 */
import { NextResponse } from 'next/server';
import { processRecurring } from '@/lib/processRecurring';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const spawned = await processRecurring(null); // null = all users
    return NextResponse.json({ ok: true, spawned });
  } catch (e: any) {
    console.error('[finance-recurring cron] error:', e);
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

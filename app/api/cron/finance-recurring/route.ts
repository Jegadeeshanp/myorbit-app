/**
 * app/api/cron/finance-recurring/route.ts
 * Daily cron — processes overdue recurring templates for ALL users.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processRecurring } from '@/lib/processRecurring';

export const runtime = 'nodejs';

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const spawned = await processRecurring(null); // null = all users
    return NextResponse.json({ ok: true, spawned });
  } catch (e: any) {
    console.error('[finance-recurring cron] error:', e);
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

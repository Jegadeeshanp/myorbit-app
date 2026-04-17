/**
 * app/api/cron/cleanup-task-instances/route.ts
 * Cleans up TaskInstance records older than 7 days.
 * Runs daily at 1 AM UTC via Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Compute cutoff date: 7 days ago
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 7);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    // Delete all TaskInstance records with date < cutoff
    const result = await prisma.taskInstance.deleteMany({
      where: {
        date: {
          lt: cutoff,
        },
      },
    });

    return NextResponse.json({
      deleted: result.count,
      cutoff,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[cleanup-task-instances cron]', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

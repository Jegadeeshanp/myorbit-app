import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function subDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today  = new Date().toISOString().split('T')[0];
    const cutoff = subDays(today, 7);

    const { count } = await prisma.taskInstance.deleteMany({
      where: { date: { lt: cutoff } },
    });

    return NextResponse.json({ deleted: count, cutoff });
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

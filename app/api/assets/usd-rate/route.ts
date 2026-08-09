import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireUserId();
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyOrbit/1.0)' }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return NextResponse.json({ rate: null });
    const data = await res.json();
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return NextResponse.json({ rate: typeof rate === 'number' && rate > 0 ? rate : null });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ rate: null });
  }
}

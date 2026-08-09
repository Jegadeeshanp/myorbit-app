import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// Yahoo Finance — NSE/BSE stocks and ETFs (e.g. RELIANCE.NS, GOLDBEES.NS)
async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&region=IN`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyOrbit/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch { return null; }
}

// MFAPI.in — Indian mutual fund NAV by AMFI scheme code (e.g. 119551)
async function fetchMfNav(schemeCode: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const nav = parseFloat(data?.data?.[0]?.nav);
    return isFinite(nav) && nav > 0 ? nav : null;
  } catch { return null; }
}

// Route symbol to the right data source
async function fetchPrice(symbol: string): Promise<number | null> {
  // All-digit → AMFI scheme code → MFAPI
  if (/^\d+$/.test(symbol)) return fetchMfNav(symbol);
  // Otherwise Yahoo Finance (NSE .NS, BSE .BO, ETFs, etc.)
  return fetchYahooPrice(symbol);
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all assets that have a symbol set and a positive unit count
    const rows = await prisma.$queryRaw<{
      id: string;
      value: string;
      units: number | null;
      symbol: string | null;
    }[]>`
      SELECT id, value, units, symbol
      FROM "Asset"
      WHERE symbol IS NOT NULL
        AND symbol <> ''
        AND units IS NOT NULL
        AND units > 0
    `;

    if (rows.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No assets with symbol + units found' });
    }

    // Group assets by symbol to minimise API calls
    const bySymbol = new Map<string, { id: string; units: number }[]>();
    for (const r of rows) {
      if (!r.symbol || !r.units) continue;
      const bucket = bySymbol.get(r.symbol) ?? [];
      bucket.push({ id: r.id, units: r.units });
      bySymbol.set(r.symbol, bucket);
    }

    let updated = 0;
    const failed: string[] = [];

    for (const [symbol, assets] of bySymbol.entries()) {
      // Small delay between symbols to be polite to upstream APIs
      await new Promise(r => setTimeout(r, 200));

      const price = await fetchPrice(symbol);
      if (price === null) {
        failed.push(symbol);
        continue;
      }

      for (const { id, units } of assets) {
        const newValue = Math.round(price * units * 100) / 100;
        await prisma.asset.update({
          where: { id },
          data: { value: await encryptNumber(newValue) },
        });
        updated++;
      }
    }

    return NextResponse.json({
      updated,
      symbolsProcessed: bySymbol.size,
      failed: failed.length ? failed : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

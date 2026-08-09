import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; MyOrbit/1.0)' };

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: YAHOO_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch { return null; }
}

async function fetchMfNav(schemeCode: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const nav = parseFloat(data?.data?.[0]?.nav);
    return isFinite(nav) && nav > 0 ? nav : null;
  } catch { return null; }
}

const INR_SUFFIXES = ['.NS', '.BO', '.BSE'];
function isIndianSymbol(s: string) {
  return INR_SUFFIXES.some(x => s.toUpperCase().endsWith(x));
}

async function fetchPriceInr(symbol: string, usdInr: number | null): Promise<number | null> {
  if (/^\d+$/.test(symbol)) return fetchMfNav(symbol);
  const price = await fetchYahooPrice(symbol);
  if (price === null) return null;
  if (isIndianSymbol(symbol)) return price;
  if (!usdInr) return null;
  return Math.round(price * usdInr * 100) / 100;
}

export async function POST() {
  try {
    const userId = await requireUserId();

    const rows = await prisma.$queryRaw<{
      id: string; value: string; units: number | null; symbol: string | null; invested: string;
      name: string; category: string;
    }[]>`
      SELECT id, value, units, symbol, invested, name, category
      FROM "Asset"
      WHERE "userId" = ${userId}
        AND symbol IS NOT NULL
        AND symbol <> ''
        AND units IS NOT NULL
        AND units > 0
    `;

    if (rows.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No assets with symbol + units found' });
    }

    // Fetch USD→INR rate once if any symbol is USD-denominated
    const hasUsdSymbols = rows.some(r => r.symbol && !/^\d+$/.test(r.symbol) && !isIndianSymbol(r.symbol));
    const usdInr = hasUsdSymbols ? await fetchYahooPrice('USDINR=X') : null;

    const updated: { id: string; name: string; value: number }[] = [];
    const failed: string[] = [];

    // Deduplicate symbols to minimise API calls
    const priceCache = new Map<string, number | null>();
    for (const row of rows) {
      if (!row.symbol || !row.units) continue;
      if (!priceCache.has(row.symbol)) {
        await new Promise(r => setTimeout(r, 150));
        priceCache.set(row.symbol, await fetchPriceInr(row.symbol, usdInr));
      }
      const price = priceCache.get(row.symbol) ?? null;
      if (price === null) {
        if (!failed.includes(row.symbol)) failed.push(row.symbol);
        continue;
      }
      const newValue = Math.round(price * row.units * 100) / 100;
      await prisma.asset.update({ where: { id: row.id }, data: { value: await encryptNumber(newValue) } });
      updated.push({ id: row.id, name: row.name, value: newValue });
    }

    // Return full refreshed asset list so the client can update the store in one shot
    const allAssets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const decrypted = await Promise.all(allAssets.map(async a => ({
      id: a.id, name: a.name, category: a.category,
      symbol: (a as any).symbol ?? undefined,
      units: (a as any).units ?? undefined,
      invested: await decryptNumber(a.invested),
      value: await decryptNumber(a.value),
    })));

    return NextResponse.json({
      updated: updated.length,
      failed: failed.length ? failed : undefined,
      usdInr: usdInr ?? undefined,
      assets: decrypted,
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

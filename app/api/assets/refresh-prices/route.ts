import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// Yahoo Finance requires a crumb+cookie pair since 2023 for reliable price data.
// Cache them for 55 min (tokens last ~1 hr). In serverless each cold start re-fetches.
let credCache: { cookie: string; crumb: string; expiry: number } | null = null;

async function getYahooCreds(): Promise<{ cookie: string; crumb: string } | null> {
  if (credCache && credCache.expiry > Date.now()) return credCache;
  try {
    const cookieRes = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': BROWSER_UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });
    // Node 18.14+ exposes getSetCookie(); fall back to get() for older runtimes
    const rawCookies: string[] =
      typeof (cookieRes.headers as any).getSetCookie === 'function'
        ? (cookieRes.headers as any).getSetCookie()
        : [cookieRes.headers.get('set-cookie') ?? ''];
    const cookie = rawCookies.map((c: string) => c.split(';')[0]).filter(Boolean).join('; ');
    if (!cookie) return null;

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': BROWSER_UA, Cookie: cookie },
      signal: AbortSignal.timeout(6000),
    });
    if (!crumbRes.ok) return null;
    const crumb = await crumbRes.text();
    if (!crumb || crumb.startsWith('<')) return null; // got an HTML error page

    credCache = { cookie, crumb, expiry: Date.now() + 55 * 60 * 1000 };
    return { cookie, crumb };
  } catch { return null; }
}

// Batch-fetch prices for multiple Yahoo symbols in one request (v7 quote endpoint).
async function fetchYahooBatch(
  symbols: string[],
  creds: { cookie: string; crumb: string } | null,
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!symbols.length) return map;
  try {
    const symbolsParam = symbols.map(encodeURIComponent).join(',');
    const crumbQ = creds ? `&crumb=${encodeURIComponent(creds.crumb)}` : '';
    const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}&fields=regularMarketPrice${crumbQ}`;
    const headers: Record<string, string> = {
      'User-Agent': BROWSER_UA,
      Accept: 'application/json',
    };
    if (creds) headers['Cookie'] = creds.cookie;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return map;
    const data = await res.json();
    const results: any[] = data?.quoteResponse?.result ?? [];
    for (const item of results) {
      if (typeof item.regularMarketPrice === 'number' && item.regularMarketPrice > 0) {
        map.set(item.symbol, item.regularMarketPrice);
      }
    }
  } catch { /* best-effort */ }
  return map;
}

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

const INR_SUFFIXES = ['.NS', '.BO', '.BSE'];
const isIndianSymbol = (s: string) => INR_SUFFIXES.some(x => s.toUpperCase().endsWith(x));

export async function POST() {
  try {
    const userId = await requireUserId();

    const rows = await prisma.$queryRaw<{
      id: string; value: string; units: number | null; symbol: string | null;
      invested: string; name: string; category: string;
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

    // Split into Yahoo symbols vs MF scheme codes (all-digit strings)
    const yahooSymbols = [...new Set(
      rows.filter(r => r.symbol && !/^\d+$/.test(r.symbol)).map(r => r.symbol!),
    )];
    const mfRows = rows.filter(r => r.symbol && /^\d+$/.test(r.symbol));

    // Get Yahoo crumb credentials once
    const creds = await getYahooCreds();

    // Fetch USD→INR rate if needed (batch alongside other symbols)
    const hasUsdSymbols = yahooSymbols.some(s => !isIndianSymbol(s));
    const fetchBatch = hasUsdSymbols ? [...yahooSymbols, 'USDINR=X'] : yahooSymbols;

    // One network call for all Yahoo symbols
    const priceMap = await fetchYahooBatch(fetchBatch, creds);
    const usdInr = priceMap.get('USDINR=X') ?? null;

    // Convert non-INR prices to INR
    for (const symbol of yahooSymbols) {
      if (!isIndianSymbol(symbol) && priceMap.has(symbol) && usdInr) {
        priceMap.set(symbol, Math.round(priceMap.get(symbol)! * usdInr * 100) / 100);
      }
    }

    // Fetch MF NAVs (separate API, sequential with small delay to avoid rate-limit)
    const mfPriceMap = new Map<string, number | null>();
    for (const row of mfRows) {
      if (!row.symbol || mfPriceMap.has(row.symbol)) continue;
      await new Promise(r => setTimeout(r, 100));
      mfPriceMap.set(row.symbol, await fetchMfNav(row.symbol));
    }

    const updated: { id: string; name: string; value: number }[] = [];
    const failed: string[] = [];

    for (const row of rows) {
      if (!row.symbol || !row.units) continue;
      const isMf = /^\d+$/.test(row.symbol);
      const price = isMf ? (mfPriceMap.get(row.symbol) ?? null) : (priceMap.get(row.symbol) ?? null);

      if (price === null) {
        if (!failed.includes(row.symbol)) failed.push(row.symbol);
        continue;
      }
      const newValue = Math.round(price * row.units * 100) / 100;
      await prisma.asset.update({ where: { id: row.id }, data: { value: await encryptNumber(newValue) } });
      updated.push({ id: row.id, name: row.name, value: newValue });
    }

    // Return full refreshed asset list so client updates store in one shot
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

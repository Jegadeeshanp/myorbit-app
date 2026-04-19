import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  function parseUrl(raw?: string) {
    if (!raw) return 'MISSING';
    try {
      const u = new URL(raw);
      return `${u.username}@${u.hostname}:${u.port}${u.pathname}`;
    } catch { return 'invalid URL'; }
  }

  const result: Record<string, any> = {
    DATABASE_URL:        parseUrl(process.env.DATABASE_URL),
    DATABASE_URL_FULL:   process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'MISSING',
    DIRECT_URL:          parseUrl(process.env.DIRECT_URL),
    DIRECT_URL_FULL:     process.env.DIRECT_URL ? process.env.DIRECT_URL.substring(0, 50) + '...' : 'MISSING',
    AUTH_SECRET:         process.env.AUTH_SECRET     ? 'set' : 'MISSING',
    NEXTAUTH_SECRET:     process.env.NEXTAUTH_SECRET ? 'set' : 'MISSING',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    result.db = 'ok';
  } catch (e: any) {
    result.db = 'error';
    result.dbError = e?.message ?? String(e);
  }

  return NextResponse.json(result);
}

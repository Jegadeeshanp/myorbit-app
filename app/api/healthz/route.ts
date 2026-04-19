import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    DATABASE_URL: parseUrl(process.env.DATABASE_URL),
    DIRECT_URL:   parseUrl(process.env.DIRECT_URL),
    AUTH_SECRET:  process.env.AUTH_SECRET     ? 'set' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'MISSING',
  };

  // Test 1: default prisma client (uses DATABASE_URL)
  try {
    const p1 = new PrismaClient();
    await p1.$queryRaw`SELECT 1`;
    await p1.$disconnect();
    result.db_pooler = 'ok';
  } catch (e: any) {
    result.db_pooler = 'error: ' + (e?.message ?? String(e)).slice(0, 200);
  }

  // Test 2: direct connection (uses DIRECT_URL as the url)
  try {
    const p2 = new PrismaClient({
      datasources: { db: { url: process.env.DIRECT_URL } },
    });
    await p2.$queryRaw`SELECT 1`;
    await p2.$disconnect();
    result.db_direct = 'ok';
  } catch (e: any) {
    result.db_direct = 'error: ' + (e?.message ?? String(e)).slice(0, 200);
  }

  return NextResponse.json(result);
}

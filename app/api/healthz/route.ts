import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  const result: Record<string, any> = {
    DATABASE_URL:  process.env.DATABASE_URL  ? 'set' : 'MISSING',
    DIRECT_URL:    process.env.DIRECT_URL    ? 'set' : 'MISSING',
    AUTH_SECRET:   process.env.AUTH_SECRET   ? 'set' : 'MISSING',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'MISSING',
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

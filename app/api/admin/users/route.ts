import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkSecret(req: NextRequest) {
  const secret =
    req.headers.get('x-admin-secret') ??
    req.nextUrl.searchParams.get('secret');
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}

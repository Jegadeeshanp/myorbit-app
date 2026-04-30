import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';

function makeToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error('Auth secret is not configured');
  return createHmac('sha256', secret).update(userId).digest('hex');
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const token = makeToken(userId);
    return NextResponse.json({ token, userId });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

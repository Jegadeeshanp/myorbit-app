import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/save-token — check if current user has any registered tokens
export async function GET() {
  try {
    const userId = await requireUserId();
    const count = await prisma.pushToken.count({ where: { userId } });
    return NextResponse.json({ hasToken: count > 0 });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/save-token — register or refresh a device's FCM push token
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { token, platform } = body as { token?: string; platform?: string };

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // Upsert: update userId/platform if the token already exists,
    // create a new row if it's a new device registration.
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform ?? 'web',
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: platform ?? 'web',
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[save-token] failed', e);
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/save-token — remove a token (e.g. user disables notifications)
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const { token } = body as { token?: string };

    if (token) {
      // Remove a specific token
      await prisma.pushToken.deleteMany({ where: { token, userId } });
    } else {
      // Remove all tokens for this user
      await prisma.pushToken.deleteMany({ where: { userId } });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

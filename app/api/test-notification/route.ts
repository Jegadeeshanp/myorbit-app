import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendToUser } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const userId = await requireUserId();

    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (!tokens.length) {
      return NextResponse.json({ error: 'No registered devices found' }, { status: 404 });
    }

    await sendToUser(userId, {
      title: '🎉 MyOrbit Notifications',
      body: 'Push notifications are working!',
      url: '/orbit',
      tag: 'test',
    }, prisma);

    return NextResponse.json({ ok: true, devices: tokens.length });
  } catch (e: any) {
    console.error('[test-notification]', e);
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}

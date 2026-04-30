import { sendToToken } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();
    const record = await prisma.pushToken.findFirst({ where: { userId } });

    if (!record?.token) {
      return NextResponse.json({ error: 'No token found' }, { status: 400 });
    }

    await sendToToken(record.token, {
      title: '🔥 MyOrbit Test',
      body: 'If you see this, push notifications work!',
      url: '/orbit/tasks',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}

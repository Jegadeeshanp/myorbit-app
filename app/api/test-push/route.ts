import { sendToToken } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const record = await prisma.pushToken.findFirst();

    if (!record?.token) {
      return NextResponse.json({ error: 'No token found' }, { status: 400 });
    }

    await sendToToken(record.token, {
      title: '🔥 MyOrbit Test',
      body: 'If you see this, push notifications work!',
      url: '/orbit/tasks',
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
import { sendToToken } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const record = await prisma.pushToken.findFirst();

    if (!record?.token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    await sendToToken(record.token, {
      title: '🔥 Test Notification',
      body: 'If you see this, everything works!',
      url: '/orbit/tasks',
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
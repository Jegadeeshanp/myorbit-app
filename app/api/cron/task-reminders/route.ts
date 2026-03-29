// app/api/cron/task-reminders/route.ts
// Vercel cron: daily at 8 AM IST (2:30 AM UTC) → "30 2 * * *"
// Sends a push notification for every user who has tasks due today.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendToTokens } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

/** Returns today's date in IST as YYYY-MM-DD */
function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = todayIST();

    // All active tasks due today, across all users
    const tasks = await prisma.task.findMany({
      where: { dueDate: today, status: 'active', isActive: true },
      select: { userId: true, title: true, dueTime: true },
    });

    if (!tasks.length) return NextResponse.json({ ok: true, sent: 0 });

    // Group by userId
    const byUser = tasks.reduce<Record<string, string[]>>((acc, t) => {
      (acc[t.userId] ??= []).push(t.title);
      return acc;
    }, {});

    let sent = 0;
    for (const [userId, titles] of Object.entries(byUser)) {
      try {
        // Get all FCM tokens for this user
        const rows = await prisma.pushToken.findMany({
          where:  { userId },
          select: { token: true },
        });
        if (!rows.length) continue;

        const count = titles.length;
        const body  = count === 1 ? titles[0] : `${titles[0]} +${count - 1} more`;

        await sendToTokens(rows.map(r => r.token), {
          title: `📋 ${count} task${count > 1 ? 's' : ''} due today`,
          body,
          url:   '/orbit/tasks',
          tag:   `tasks-due-${userId}`,
        });
        sent++;
      } catch (e) {
        console.error(`[task-reminders] user ${userId}:`, e);
      }
    }

    return NextResponse.json({ ok: true, sent, users: Object.keys(byUser).length });
  } catch (e: any) {
    console.error('[task-reminders]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

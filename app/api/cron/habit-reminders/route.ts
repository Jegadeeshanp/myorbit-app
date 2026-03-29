// app/api/cron/habit-reminders/route.ts
// Vercel cron runs 4× per day (see vercel.json).
// Each run auto-detects the current IST time slot and notifies users
// whose habits haven't been logged yet for that slot today.
//
// Slot → IST time → UTC cron
//   morning  →  7:00 AM → "30 1 * * *"   (also sends all_day habits)
//   noon     → 12:00 PM → "30 6 * * *"
//   evening  →  6:00 PM → "30 12 * * *"
//   night    →  9:00 PM → "30 15 * * *"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendToTokens } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

type Slot = 'morning' | 'noon' | 'evening' | 'night';

/** Current IST hour → time slot */
function currentSlot(): Slot {
  const hour = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }),
    10
  );
  if (hour >= 5  && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 20) return 'evening';
  return 'night';
}

/** Today's date in IST as YYYY-MM-DD */
function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** Day-of-week in IST: 0=Sun … 6=Sat */
function todayDOW(): number {
  // Use a fixed reference date to extract numeric DOW in the IST timezone
  const istDate = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
  return istDate.getDay(); // 0=Sun, 1=Mon … 6=Sat
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
    const slot  = currentSlot();
    const today = todayIST();
    const dow   = todayDOW();

    // Fetch habits that match this slot (or all_day on morning run)
    // timeOfDay: all_day | morning | noon | evening | night | custom
    const slotFilter = slot === 'morning'
      ? ['morning', 'all_day']
      : [slot];

    const habits = await prisma.habit.findMany({
      where: {
        isActive: true,
        timeOfDay: { in: slotFilter },
      },
      select: {
        id:        true,
        userId:    true,
        name:      true,
        daysOfWeek: true,
      },
    });

    if (!habits.length) return NextResponse.json({ ok: true, sent: 0, slot });

    // Filter to habits scheduled for today's day of week
    const todayHabits = habits.filter(h => {
      try {
        const days: number[] = JSON.parse(h.daysOfWeek || '[0,1,2,3,4,5,6]');
        return days.includes(dow);
      } catch { return true; }
    });

    // Find which habits have already been logged today
    const habitIds = todayHabits.map(h => h.id);
    const logs = await prisma.habitLog.findMany({
      where:  { habitId: { in: habitIds }, logDate: today },
      select: { habitId: true },
    });
    const loggedIds = new Set(logs.map(l => l.habitId));

    // Keep only un-logged habits
    const pending = todayHabits.filter(h => !loggedIds.has(h.id));
    if (!pending.length) return NextResponse.json({ ok: true, sent: 0, slot, reason: 'all logged' });

    // Group by userId
    const byUser = pending.reduce<Record<string, string[]>>((acc, h) => {
      (acc[h.userId] ??= []).push(h.name);
      return acc;
    }, {});

    const slotEmoji: Record<Slot, string> = {
      morning: '🌅', noon: '☀️', evening: '🌆', night: '🌙',
    };

    let sent = 0;
    for (const [userId, names] of Object.entries(byUser)) {
      try {
        const rows = await prisma.pushToken.findMany({
          where:  { userId },
          select: { token: true },
        });
        if (!rows.length) continue;

        const count = names.length;
        const body  = count === 1 ? names[0] : `${names[0]} +${count - 1} more`;

        await sendToTokens(rows.map(r => r.token), {
          title: `${slotEmoji[slot]} ${count} habit${count > 1 ? 's' : ''} to check in`,
          body,
          url:   '/orbit/habits',
          tag:   `habits-${slot}-${userId}`,
        });
        sent++;
      } catch (e) {
        console.error(`[habit-reminders] user ${userId}:`, e);
      }
    }

    return NextResponse.json({ ok: true, sent, slot, users: Object.keys(byUser).length });
  } catch (e: any) {
    console.error('[habit-reminders]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

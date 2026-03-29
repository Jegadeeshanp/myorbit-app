// app/api/cron/reminders/route.ts
// Runs every minute: "* * * * *"
//
// Each run checks what is due RIGHT NOW in IST and sends push notifications:
//
//   Tasks  — fires at the task's exact dueTime (HH:MM) on its dueDate.
//            Tasks with no dueTime get a nudge at 08:00 IST.
//
//   Habits — fires at the habit's exact customTime (HH:MM) for custom habits.
//            Slot-based habits (morning/noon/evening/night/all_day) fire at:
//              all_day / morning → 07:00 IST
//              noon              → 12:00 IST
//              evening           → 18:00 IST
//              night             → 21:00 IST
//
// Only habits not yet logged today are notified.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendToTokens } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// ── Helpers ────────────────────────────────────────────────────────────────

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/** Current IST time as "HH:MM" */
function nowIST(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  }); // e.g. "14:05"
}

/** Today's date in IST as "YYYY-MM-DD" */
function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** Day-of-week in IST (0=Sun … 6=Sat) */
function todayDOW(): number {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  ).getDay();
}

// Fixed nudge times for slot-based habits (IST HH:MM)
const SLOT_TIMES: Record<string, string> = {
  all_day: '07:00',
  morning: '07:00',
  noon:    '12:00',
  evening: '18:00',
  night:   '21:00',
};

// ── Token cache helper ─────────────────────────────────────────────────────

async function tokensFor(userId: string): Promise<string[]> {
  const rows = await prisma.pushToken.findMany({
    where:  { userId },
    select: { token: true },
  });
  return rows.map(r => r.token);
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now   = nowIST();   // "HH:MM"
  const today = todayIST(); // "YYYY-MM-DD"
  const dow   = todayDOW(); // 0–6

  const stats = { tasksSent: 0, habitsSent: 0 };

  // ── 1. Task reminders ────────────────────────────────────────────────────
  // Find tasks due today where dueTime matches the current minute,
  // OR tasks with no dueTime that are due today at 08:00.
  const taskFilter =
    now === '08:00'
      ? { OR: [{ dueTime: now }, { dueTime: null }] }
      : { dueTime: now };

  const tasks = await prisma.task.findMany({
    where: {
      dueDate:  today,
      status:   'active',
      isActive: true,
      ...taskFilter,
    },
    select: { userId: true, title: true, dueTime: true },
  });

  // Group by user and send
  const tasksByUser = tasks.reduce<Record<string, string[]>>((acc, t) => {
    (acc[t.userId] ??= []).push(t.title);
    return acc;
  }, {});

  for (const [userId, titles] of Object.entries(tasksByUser)) {
    const tokens = await tokensFor(userId);
    if (!tokens.length) continue;
    const count = titles.length;
    try {
      await sendToTokens(tokens, {
        title: `📋 ${count} task${count > 1 ? 's' : ''} due now`,
        body:  count === 1 ? titles[0] : `${titles[0]} +${count - 1} more`,
        url:   '/orbit/tasks',
        tag:   `tasks-${userId}-${now}`,
      });
      stats.tasksSent++;
    } catch (e) {
      console.error(`[reminders] tasks user ${userId}:`, e);
    }
  }

  // ── 2. Habit reminders ───────────────────────────────────────────────────
  // a) Custom-time habits — fire at their exact customTime
  // b) Slot-based habits  — fire at the fixed slot time

  // Determine which slots fire at this exact minute
  const activeSlots = Object.entries(SLOT_TIMES)
    .filter(([, t]) => t === now)
    .map(([slot]) => slot);

  const habitWhere =
    activeSlots.length > 0
      ? {
          OR: [
            { timeOfDay: 'custom', customTime: now },
            { timeOfDay: { in: activeSlots } },
          ],
        }
      : { timeOfDay: 'custom', customTime: now };

  const habits = await prisma.habit.findMany({
    where: { isActive: true, ...habitWhere },
    select: { id: true, userId: true, name: true, daysOfWeek: true, timeOfDay: true },
  });

  // Filter to today's scheduled habits
  const todayHabits = habits.filter(h => {
    try {
      const days: number[] = JSON.parse(h.daysOfWeek || '[0,1,2,3,4,5,6]');
      return days.includes(dow);
    } catch { return true; }
  });

  if (todayHabits.length > 0) {
    // Skip habits already logged today
    const ids = todayHabits.map(h => h.id);
    const logs = await prisma.habitLog.findMany({
      where:  { habitId: { in: ids }, logDate: today },
      select: { habitId: true },
    });
    const logged = new Set(logs.map(l => l.habitId));
    const pending = todayHabits.filter(h => !logged.has(h.id));

    const habitsByUser = pending.reduce<Record<string, string[]>>((acc, h) => {
      (acc[h.userId] ??= []).push(h.name);
      return acc;
    }, {});

    for (const [userId, names] of Object.entries(habitsByUser)) {
      const tokens = await tokensFor(userId);
      if (!tokens.length) continue;
      const count = names.length;
      try {
        await sendToTokens(tokens, {
          title: `🔥 ${count} habit${count > 1 ? 's' : ''} to check in`,
          body:  count === 1 ? names[0] : `${names[0]} +${count - 1} more`,
          url:   '/orbit/habits',
          tag:   `habits-${userId}-${now}`,
        });
        stats.habitsSent++;
      } catch (e) {
        console.error(`[reminders] habits user ${userId}:`, e);
      }
    }
  }

  return NextResponse.json({ ok: true, now, today, ...stats });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptNumber } from '@/lib/encryption';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const DEMO_EMAIL    = 'demo@myorbit.app';
const DEMO_PASSWORD = 'Demo@MyOrbit2024';
const DEMO_NAME     = 'Demo User';

export async function POST() {
  try {
    let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!user) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      user = await prisma.user.create({
        data: { email: DEMO_EMAIL, name: DEMO_NAME, passwordHash },
      });
    }
    const userId = user.id;

    const [accountCount, taskCount, habitCount, goalCount] = await Promise.all([
      prisma.account.count({ where: { userId } }),
      prisma.task.count({ where: { userId } }),
      prisma.habit.count({ where: { userId } }),
      prisma.goal.count({ where: { userId } }),
    ]);

    const today = new Date().toISOString().split('T')[0];

    if (accountCount === 0) {
      await prisma.account.create({
        data: {
          userId,
          name: 'Main Checking',
          type: 'Bank',
          balance: await encryptNumber(4250),
        },
      });
    }

    if (taskCount === 0) {
      await prisma.task.createMany({
        data: [
          { userId, title: 'Review monthly budget',         dueDate: today, priority: 'high',   tags: '[]' },
          { userId, title: 'Schedule dentist appointment',                   priority: 'medium', tags: '[]' },
          { userId, title: 'Call mom',                      dueDate: today, priority: 'none',   tags: '[]' },
          { userId, title: 'Finish project proposal',                        priority: 'high',   tags: '[]' },
          { userId, title: 'Buy groceries',                 dueDate: today, priority: 'low',    tags: '[]' },
        ],
      });
    }

    if (habitCount === 0) {
      await prisma.habit.createMany({
        data: [
          { userId, name: 'Morning walk',             color: '#10b981', iconEmoji: '🚶', daysOfWeek: '[0,1,2,3,4,5,6]' },
          { userId, name: 'Read for 30 minutes',      color: '#6366f1', iconEmoji: '📚', daysOfWeek: '[0,1,2,3,4,5,6]' },
          { userId, name: 'Drink 8 glasses of water', color: '#3b82f6', iconEmoji: '💧', daysOfWeek: '[0,1,2,3,4,5,6]' },
        ],
      });
    }

    if (goalCount === 0) {
      const date90  = new Date(Date.now() + 90  * 86400000).toISOString().split('T')[0];
      const date180 = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
      await prisma.goal.createMany({
        data: [
          { userId, title: 'Run a 5K',                   category: 'Health',  why: 'Improve fitness and mental health', deadline: date90  },
          { userId, title: 'Save $10,000 emergency fund', category: 'Finance', why: 'Build financial security',          deadline: date180 },
        ],
      });
    }

    return NextResponse.json({ ok: true, email: DEMO_EMAIL, password: DEMO_PASSWORD });
  } catch (e: any) {
    console.error('[POST /api/demo]', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to set up demo' }, { status: 500 });
  }
}

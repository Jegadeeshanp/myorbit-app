import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Clean up missed tasks every 7 days
 * 
 * Missed tasks are tasks with dueDate more than 2 days in the past
 * (dueDate < today - 2 days means it's been in missed section for 7+ days)
 * 
 * This should be called daily via an external cron service (e.g., Vercel Cron)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 9); // 9 days ago = 7 days in missed + 2 days buffer
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Find all missed tasks that are older than 7 days
    const missedTasksToDelete = await prisma.task.findMany({
      where: {
        status: 'active',
        dueDate: {
          lt: sevenDaysAgoStr,
        },
        habit: {
          category: 'health',
        },
      },
      select: { id: true, userId: true },
    });

    if (missedTasksToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No missed tasks to clean up',
        deletedCount: 0,
      });
    }

    // Delete the old missed tasks
    const result = await prisma.task.deleteMany({
      where: {
        id: {
          in: missedTasksToDelete.map(t => t.id),
        },
      },
    });

    return NextResponse.json({
      message: 'Missed tasks cleaned up',
      deletedCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[cleanup-missed-tasks]', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

// POST method for manual trigger during testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secret = body.secret || process.env.CRON_SECRET;
    
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 9);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const missedTasksToDelete = await prisma.task.findMany({
      where: {
        status: 'active',
        dueDate: {
          lt: sevenDaysAgoStr,
        },
        habit: {
          category: 'health',
        },
      },
      select: { id: true, userId: true },
    });

    if (missedTasksToDelete.length === 0) {
      return NextResponse.json({ 
        message: 'No missed tasks to clean up',
        deletedCount: 0,
      });
    }

    const result = await prisma.task.deleteMany({
      where: {
        id: {
          in: missedTasksToDelete.map(t => t.id),
        },
      },
    });

    return NextResponse.json({
      message: 'Missed tasks cleaned up (manual trigger)',
      deletedCount: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[cleanup-missed-tasks]', e);
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 });
  }
}

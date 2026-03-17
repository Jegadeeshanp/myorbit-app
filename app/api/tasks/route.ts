import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const smartList = searchParams.get('smartList');
    const listId = searchParams.get('listId');

    const today = new Date().toISOString().split('T')[0];
    const next7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let where: any = { userId };

    if (smartList === 'today') {
      where = { userId, dueDate: today, status: 'active', isActive: true };
    } else if (smartList === 'inbox') {
      where = { userId, listId: null, status: 'active', isActive: true };
    } else if (smartList === 'next7') {
      where = { userId, status: 'active', isActive: true, dueDate: { gte: today, lte: next7 } };
    } else if (smartList === 'completed') {
      where = { userId, status: 'completed', isActive: true };
    } else if (smartList === 'trash') {
      where = { userId, isActive: false };
    } else if (smartList === 'all') {
      where = { userId, status: 'active', isActive: true };
    } else if (listId) {
      where = { userId, listId, status: 'active', isActive: true };
    } else {
      where = { userId, isActive: true };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        list: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(tasks);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { title, notes, priority, dueDate, dueTime, tags, listId } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        notes: notes?.trim() || null,
        priority: priority || 'none',
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        listId: listId || null,
      },
      include: { subtasks: true, list: true },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

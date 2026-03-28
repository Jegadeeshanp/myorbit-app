import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const cats = await prisma.userCategory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(cats);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { name, type, icon } = await req.json();
    if (!name?.trim() || !['expense', 'income'].includes(type)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const cat = await prisma.userCategory.upsert({
      where: { userId_name_type: { userId, name: name.trim(), type } },
      create: { userId, name: name.trim(), type, icon: icon ?? 'Package' },
      update: { icon: icon ?? 'Package' },
    });
    return NextResponse.json(cat, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

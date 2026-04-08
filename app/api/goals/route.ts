import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const HTML_RE = /<[^>]*>/;
const noHtml = (v: string) => !HTML_RE.test(v);
const goalPostSchema = z.object({
  title: z.string().min(1, 'Title required').max(200).refine(noHtml, { message: 'Title cannot contain HTML' }),
  category: z.string().max(50).optional(),
  why: z.string().max(1000).refine(noHtml, { message: 'Why cannot contain HTML' }).optional().nullable(),
  metric: z.string().max(500).refine(noHtml, { message: 'Metric cannot contain HTML' }).optional().nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  milestones: z.array(z.object({ title: z.string().max(200), horizon: z.string().optional() })).optional(),
  processes: z.array(z.object({ title: z.string().max(200), frequency: z.string().optional() })).optional(),
});

export const runtime = 'nodejs';

export async function GET() {
  try {
    const userId = await requireUserId();
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        milestones: { orderBy: { createdAt: 'asc' } },
        processes: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(goals);
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = goalPostSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { title, category, why = null, metric = null, deadline = null, milestones = [], processes = [] } = parsed.data;

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        category: category || 'Personal',
        why: why?.trim() || null,
        metric: metric?.trim() || null,
        deadline: deadline || null,
        milestones: {
          create: milestones.map((m: any) => ({ userId, title: m.title, horizon: m.horizon || '1m' })),
        },
        processes: {
          create: processes.map((p: any) => ({ userId, title: p.title, frequency: p.frequency || 'daily' })),
        },
      },
      include: { milestones: true, processes: true },
    });
    return NextResponse.json(goal, { status: 201 });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[POST /api/goals]', e?.message ?? e);
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}

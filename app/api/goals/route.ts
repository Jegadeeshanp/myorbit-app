import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const HTML_RE = /<[^>]*>/;
const noHtml = (v: string) => !HTML_RE.test(v);
const GOAL_HORIZONS    = ['1w', '1m', '3m', '6m', '1y', 'custom'] as const;
const GOAL_FREQUENCIES = ['daily', 'weekly', 'monthly', 'custom'] as const;
const GOAL_CATEGORIES  = ['Finance', 'Health', 'Career', 'Learning', 'Personal', 'Other'] as const;
const goalPostSchema = z.object({
  title:    z.string().min(1, 'Title required').max(200).refine(noHtml, { message: 'Title cannot contain HTML' }),
  category: z.enum(GOAL_CATEGORIES).optional(),
  why:      z.string().max(1000).refine(noHtml, { message: 'Why cannot contain HTML' }).optional().nullable(),
  metric:   z.string().max(500).refine(noHtml, { message: 'Metric cannot contain HTML' }).optional().nullable(),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD')
    .refine((d) => !isNaN(new Date(d).getTime()), { message: 'Deadline is not a valid calendar date' })
    .optional().nullable(),
  milestones: z.array(z.object({
    title:   z.string().min(1).max(200).refine(noHtml, { message: 'Milestone title cannot contain HTML' }),
    horizon: z.enum(GOAL_HORIZONS).optional(),
  })).optional(),
  processes: z.array(z.object({
    title:     z.string().min(1).max(200).refine(noHtml, { message: 'Process title cannot contain HTML' }),
    frequency: z.enum(GOAL_FREQUENCIES).optional(),
  })).optional(),
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

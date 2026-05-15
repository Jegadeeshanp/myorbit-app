import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const runtime = 'nodejs';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUpSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per minute per IP
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = rateLimit(`register:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Service unavailable. Please try again later.' }, { status: 503 });
  }
}

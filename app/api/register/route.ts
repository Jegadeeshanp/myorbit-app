import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signUpSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

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
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { authAccounts: { select: { provider: true } } },
    });
    if (existing) {
      // If the account was created via Google/Apple, guide the user
      const oauthProvider = existing.authAccounts[0]?.provider;
      const suggestion = oauthProvider === 'google'
        ? 'This email is linked to Google. Please sign in with Google.'
        : oauthProvider === 'apple'
          ? 'This email is linked to Apple. Please sign in with Apple.'
          : 'An account with this email already exists.';
      return NextResponse.json({ error: suggestion }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, name: true },
    });

    // Sign a 30-day JWT so mobile clients are immediately authenticated after signup
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    );
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/register]', msg);
    const detail = process.env.NODE_ENV === 'development' ? msg : undefined;
    return NextResponse.json(
      { error: 'Service unavailable. Please try again later.', ...(detail && { detail }) },
      { status: 503 },
    );
  }
}

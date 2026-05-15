/**
 * app/api/mobile/auth/route.ts
 * Mobile JWT authentication endpoint.
 * Returns a 30-day Bearer token stored in expo-secure-store on the mobile client.
 * All existing API routes accept this token via the Bearer fallback in lib/auth.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { SignJWT } from 'jose';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const { allowed } = rateLimit(`mobile-auth:${ip}`, 10, 15 * 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const body   = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Sign a 30-day JWT using the same secret as NextAuth
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    );
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e: any) {
    console.error('[POST /api/mobile/auth]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

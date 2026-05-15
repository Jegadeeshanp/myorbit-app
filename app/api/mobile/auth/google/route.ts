import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { accessToken } = body as { accessToken?: string };
  if (!accessToken || typeof accessToken !== 'string') {
    return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
  }

  // Verify access token and fetch profile from Google
  const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!googleRes.ok) {
    return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
  }

  const googleUser = await googleRes.json() as {
    sub?: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
  };

  const email = googleUser.email?.toLowerCase().trim();
  if (!email || !googleUser.sub) {
    return NextResponse.json({ error: 'Google did not return an email' }, { status: 400 });
  }

  try {
    // Find or create user by email
    let dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email,
          name: googleUser.name ?? email.split('@')[0],
          passwordHash: null,
        },
      });
    }

    // Upsert the OAuth link (idempotent on re-login)
    await prisma.authAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.sub,
        },
      },
      update: { email, name: googleUser.name ?? undefined },
      create: {
        userId: dbUser.id,
        provider: 'google',
        providerAccountId: googleUser.sub,
        email,
        name: googleUser.name ?? undefined,
      },
    });

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    );
    const token = await new SignJWT({ userId: dbUser.id, email: dbUser.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret);

    return NextResponse.json({
      token,
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.name },
    });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}

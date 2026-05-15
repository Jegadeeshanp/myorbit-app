import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT, createRemoteJWKSet, jwtVerify } from 'jose';

export const runtime = 'nodejs';

// Apple's public keys for JWT verification
const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys')
);

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { identityToken, fullName } = body as {
    identityToken?: string;
    fullName?: string;
  };

  if (!identityToken || typeof identityToken !== 'string') {
    return NextResponse.json({ error: 'Missing identityToken' }, { status: 400 });
  }

  // Verify the Apple-signed JWT
  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: 'https://appleid.apple.com',
      // Audience is the bundle ID for native Apple Sign In
      audience: 'com.jegadeeshan.myorbit',
    });
    payload = result.payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid Apple identity token' }, { status: 401 });
  }

  const sub = payload.sub as string | undefined;
  if (!sub) {
    return NextResponse.json({ error: 'Invalid token: missing sub' }, { status: 400 });
  }

  try {
    // Apple only sends email on the FIRST sign-in; subsequent logins omit it.
    // So check for an existing AuthAccount by sub first.
    const existingAccount = await prisma.authAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'apple', providerAccountId: sub } },
      include: { user: true },
    });

    if (existingAccount) {
      // Returning Apple user — just issue a new JWT
      const dbUser = existingAccount.user;
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
    }

    // First time — Apple includes the email in the token
    const email = (payload.email as string | undefined)?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json(
        { error: 'Email required for first-time Apple sign-in. Please try again.' },
        { status: 400 }
      );
    }

    // Find or create user by email (links to an existing email/password account if present)
    let dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      const name = fullName?.trim() || email.split('@')[0];
      dbUser = await prisma.user.create({
        data: { email, name, passwordHash: null },
      });
    }

    await prisma.authAccount.create({
      data: {
        userId: dbUser.id,
        provider: 'apple',
        providerAccountId: sub,
        email,
        name: dbUser.name ?? undefined,
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

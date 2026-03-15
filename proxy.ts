import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use edge-safe config — NO Prisma, NO bcrypt
const { auth } = NextAuth(authConfig);

const PROTECTED = ['/orbit', '/dashboard'];
const AUTH_PAGES = ['/signin', '/signup'];

// ── Rate limiting for auth endpoints ────────────────────────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS      = 10;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const record = attempts.get(ip);
  if (!record || record.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  record.count++;
  if (record.count > MAX_ATTEMPTS) return true;
  return false;
}

export default auth(function middleware(req) {
  const { nextUrl } = req as NextRequest & { auth: any };
  const session = (req as any).auth;
  const isLoggedIn = !!session?.user;
  const isProtected = PROTECTED.some(p => nextUrl.pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some(p => nextUrl.pathname.startsWith(p));

  // Rate limit login endpoint
  if (nextUrl.pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip = getClientIp(req as unknown as NextRequest);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': '900', 'X-RateLimit-Limit': String(MAX_ATTEMPTS) } }
      );
    }
  }

  // Rate limit registration endpoint
  if (nextUrl.pathname === '/api/register' && req.method === 'POST') {
    const ip = getClientIp(req as unknown as NextRequest);
    const key = `register_${ip}`;
    const record = attempts.get(key);
    const now = Date.now();
    if (record && record.resetAt > now && record.count >= 5) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }
    if (!record || record.resetAt < now) {
      attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    } else {
      record.count++;
    }
  }

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/signin', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/orbit', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
};

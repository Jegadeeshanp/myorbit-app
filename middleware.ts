import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Use edge-safe config — NO Prisma, NO bcrypt
const { auth } = NextAuth(authConfig);

const PROTECTED = ['/orbit', '/dashboard'];
const AUTH_PAGES = ['/signin', '/signup'];

export default auth(function middleware(req) {
  const { nextUrl } = req as NextRequest & { auth: any };
  const session = (req as any).auth;
  const isLoggedIn = !!session?.user;
  const isProtected = PROTECTED.some(p => nextUrl.pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some(p => nextUrl.pathname.startsWith(p));

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

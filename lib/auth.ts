import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { jwtVerify } from 'jose';
import { headers } from 'next/headers';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Node.js runtime auth — has Prisma + bcrypt
// Used by API routes and server components (NOT middleware)
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          const { email, password } = parsed.data;
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
          });
          if (!user) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
});

export async function requireUserId(): Promise<string> {
  // 1. Cookie-based auth (web — NextAuth session)
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // 2. Bearer token fallback (mobile — JWT issued by /api/mobile/auth)
  try {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token  = authHeader.slice(7);
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
      );
      const { payload } = await jwtVerify(token, secret);
      if (payload.userId) return payload.userId as string;
    }
  } catch {
    // Invalid or expired token falls through to Unauthorized
  }

  throw new Error('Unauthorized');
}

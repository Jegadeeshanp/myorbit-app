import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
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
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    // Called after successful OAuth token exchange or credentials authorize().
    // Creates or links the DB user for OAuth providers.
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') return true;

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      try {
        // Find or create a User record by email
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: user.name ?? email.split('@')[0],
              passwordHash: null, // OAuth-only — no password
            },
          });
        }

        // Upsert the OAuth account link (idempotent on repeated sign-ins)
        await prisma.authAccount.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId!,
            },
          },
          update: { email, name: user.name ?? undefined },
          create: {
            userId: dbUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId!,
            email,
            name: user.name ?? undefined,
          },
        });

        return true;
      } catch {
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (account && account.provider !== 'credentials') {
        // OAuth first sign-in: resolve our own DB user ID from email.
        // signIn() above has already created/linked the user by this point.
        const email = token.email?.toLowerCase().trim();
        if (email) {
          const dbUser = await prisma.user.findUnique({ where: { email } });
          if (dbUser) {
            token.id   = dbUser.id;
            token.name = dbUser.name;
          }
        }
      } else if (user) {
        // Credentials sign-in: user comes from authorize()
        token.id    = user.id;
        token.name  = user.name;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string;
        session.user.name  = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId:     process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
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
          // Reject OAuth-only users (null passwordHash) — they must use their provider
          if (!user || !user.passwordHash) return null;
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

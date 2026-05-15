import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';

// Edge-safe config — no Prisma, no bcrypt.
// Used by middleware.ts (Edge runtime) for route protection.
// Real DB operations happen in lib/auth.ts (Node.js runtime).
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
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
      async authorize() {
        // Stub — real authorize is in lib/auth.ts (Node.js runtime)
        return null;
      },
    }),
  ],
};

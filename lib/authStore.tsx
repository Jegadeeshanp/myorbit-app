'use client';

import { createContext, useContext, PropsWithChildren } from 'react';
import { useSession, signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

export type User = { id: string; email: string; name: string };

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User };

type AuthContextValue = {
  auth: AuthState;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { data: session, status } = useSession();

  const auth: AuthState =
    status === 'loading'
      ? { status: 'loading' }
      : status === 'authenticated' && session?.user
      ? { status: 'authenticated', user: session.user as User }
      : { status: 'unauthenticated' };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Sign up failed' }));
      throw new Error(data.error ?? 'Sign up failed');
    }

    // Clear any lingering session before signing in as the new user
    await nextSignOut({ redirect: false });

    // Sign in as the new user
    const result = await nextSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      throw new Error('Account created but sign in failed. Please sign in manually.');
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await nextSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error || !result?.ok) {
      throw new Error('Invalid email or password.');
    }
  };

  const handleSignOut = () => nextSignOut({ callbackUrl: '/signin' });

  return (
    <AuthContext.Provider value={{ auth, signUp, signIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
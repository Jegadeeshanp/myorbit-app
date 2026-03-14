'use client';

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type User = {
  id: string;
  email: string;
  name: string;
};

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

const AUTH_USERS_KEY = 'myorbit_users_v1';
const AUTH_SESSION_KEY = 'myorbit_session_v1';

type StoredUser = { id: string; email: string; name: string; passwordHash: string };

// Naive hash — good enough for a localStorage-only demo; NOT suitable for production.
async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password + 'myorbit_salt')
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function saveSession(user: User) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const session = loadSession();
    setAuth(session ? { status: 'authenticated', user: session } : { status: 'unauthenticated' });
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const passwordHash = await hashPassword(password);
    const user: StoredUser = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      email,
      name,
      passwordHash,
    };
    saveUsers([...users, user]);
    const session: User = { id: user.id, email: user.email, name: user.name };
    saveSession(session);
    setAuth({ status: 'authenticated', user: session });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('No account found with that email.');
    const hash = await hashPassword(password);
    if (hash !== found.passwordHash) throw new Error('Incorrect password.');
    const session: User = { id: found.id, email: found.email, name: found.name };
    saveSession(session);
    setAuth({ status: 'authenticated', user: session });
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setAuth({ status: 'unauthenticated' });
  }, []);

  return (
    <AuthContext.Provider value={{ auth, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { API_BASE_URL } from '../config';

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export async function loginWithGoogle(accessToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mobile/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Google sign-in failed');
  }
  return res.json() as Promise<AuthResponse>;
}

export async function loginWithApple(
  identityToken: string,
  fullName?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mobile/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken, fullName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Apple sign-in failed');
  }
  return res.json() as Promise<AuthResponse>;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/mobile/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw new Error('Invalid credentials');
  if (!res.ok) throw new Error(`Auth error: ${res.status}`);
  return res.json() as Promise<AuthResponse>;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error(`Register error: ${res.status}`);
  return res.json() as Promise<AuthResponse>;
}

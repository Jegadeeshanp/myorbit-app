import { apiRequest } from './client';

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/mobile/auth', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function loginWithGoogle(accessToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/mobile/auth/google', {
    method: 'POST',
    body: JSON.stringify({ accessToken }),
  });
}

export async function loginWithApple(
  identityToken: string,
  fullName?: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/mobile/auth/apple', {
    method: 'POST',
    body: JSON.stringify({ identityToken, fullName }),
  });
}

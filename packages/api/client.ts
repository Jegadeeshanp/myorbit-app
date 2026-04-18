/**
 * packages/api/client.ts
 * Shared fetch client for all MyOrbit API calls.
 * Used by both web (via fetch) and mobile (via React Native fetch).
 *
 * ── Bug triage decision tree ──────────────────────────────────────────────
 * Bug found → ask:
 *
 * 1. Is it wrong data, wrong calculation, or wrong API call?
 *    YES → fix in packages/ or apps/web/app/api/
 *          One fix resolves web + iOS + Android simultaneously.
 *
 * 2. Is it UI-only and platform-specific?
 *    YES → fix only in apps/web/components/ or apps/mobile/components/
 *          No cross-platform action needed.
 *
 * 3. Is the same constant or copy hardcoded in multiple places?
 *    YES → move it to packages/config/ or packages/utils/
 *          Fix once, both platforms reference the package.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { API_BASE_URL } from '../config';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  return res.json() as Promise<T>;
}

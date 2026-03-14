/**
 * Simple in-memory rate limiter for auth routes.
 * In production, replace with Redis (e.g. @upstash/ratelimit).
 */

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

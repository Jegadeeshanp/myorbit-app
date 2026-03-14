import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;

// Required for NextAuth v5 with App Router
export const runtime = 'nodejs';

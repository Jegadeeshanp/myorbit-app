# MyOrbit — Production Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local or hosted)
- npm

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Generate secure values:
```bash
# AUTH_SECRET (32 bytes)
openssl rand -base64 32

# ENCRYPTION_KEY (32 bytes as hex)
openssl rand -hex 32
```

Your `.env` should look like:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/myorbit"
AUTH_SECRET="<output of openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="<output of openssl rand -hex 32>"
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Optional: open Prisma Studio to inspect data
npx prisma studio
```

## 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Architecture

### Authentication
- **NextAuth v5** with JWT sessions (no DB session table needed)
- **bcrypt** (cost 12) for password hashing
- Server-side auth check in `app/orbit/layout.tsx` via `auth()`
- Middleware in `middleware.ts` redirects unauthenticated users

### Database
- **Prisma + PostgreSQL**
- 6 tables: User, Session, Account, Transaction, Asset, Liability, Budget
- Every table has `userId` foreign key — complete data isolation

### Encryption
- **AES-256-GCM** (Web Crypto API, runs in Node.js edge runtime)
- Encrypted fields: `balance`, `amount`, `value`, `invested`, `borrowed`, `outstanding`, `monthlyEmi`, `totalRepaid`
- Format stored in DB: `<12-byte IV as hex>:<ciphertext as base64>`
- Key loaded from `ENCRYPTION_KEY` env var — never hardcoded

### API Layer
All data operations go through typed REST API routes:
```
POST   /api/auth/register
POST   /api/auth/signin  (NextAuth)
GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id
DELETE /api/accounts/:id
GET    /api/transactions
POST   /api/transactions
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
GET    /api/assets
POST   /api/assets
PATCH  /api/assets/:id
DELETE /api/assets/:id
GET    /api/liabilities
POST   /api/liabilities
PATCH  /api/liabilities/:id
DELETE /api/liabilities/:id
GET    /api/budgets
POST   /api/budgets
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
```

Every API route calls `requireUserId()` which verifies the JWT session.

### Security Checklist
- [x] Passwords hashed with bcrypt (cost 12)
- [x] JWT sessions (httpOnly secure cookies via NextAuth)
- [x] AES-256-GCM field encryption for sensitive financial data
- [x] Zod input validation on all API routes
- [x] userId filtering on every DB query (no cross-user data access)
- [x] Rate limiting on register (5 req/min per IP)
- [x] Server-side route protection (middleware + layout)
- [x] ENCRYPTION_KEY and AUTH_SECRET from environment variables only

## Production Deployment

For production (e.g. Vercel + Supabase):

1. Create a Supabase project, copy the `DATABASE_URL`
2. Set all env vars in your hosting provider
3. Run `npx prisma migrate deploy` (not `dev`) in CI
4. Replace in-memory rate limiter with `@upstash/ratelimit` + Redis

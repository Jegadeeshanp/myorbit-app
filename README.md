# MyOrbit

Personal life-management platform — web + mobile — built with Next.js, Expo, and a shared TypeScript monorepo.

---

## Quick start

### Web app (Next.js)

```bash
# from repo root
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile app (Expo)

```bash
cd apps/mobile
npm install
npx expo start
```

Scan the QR code with Expo Go or run on a simulator.

---

## Repository layout

```
myorbit-app/                  ← web app lives at repo root (Vercel deploys from here)
├── app/                      ← Next.js App Router pages & API routes
├── components/               ← Web UI components
├── lib/                      ← Auth, Prisma, encryption, validation, stores
├── prisma/                   ← Database schema & migrations
│
├── packages/                 ← Shared TypeScript packages
│   ├── api/                  ← Typed API client + all fetch functions
│   ├── config/               ← Shared constants (colors, account types, etc.)
│   ├── utils/                ← Pure helpers (date, currency, grouping)
│   └── validation/           ← Re-exports Zod schemas from lib/validation.ts
│
└── apps/
    ├── web/                  ← Minimal placeholder (web stays at root for Vercel)
    └── mobile/               ← Expo React Native app
        ├── app/
        │   ├── (auth)/       ← Login + register screens
        │   └── (tabs)/       ← Today · Do · Money · Body · Reflect
        ├── components/
        │   ├── shared/       ← Screen, Card, Badge, EmptyState, LoadingSkeleton
        │   └── tasks/        ← TodaySectionHeader, TaskItem
        └── lib/
            ├── authStore.ts  ← Zustand auth store (token + user)
            └── queryClient.ts
```

---

## Environment variables

```env
# Required for both web and mobile JWT auth
NEXTAUTH_SECRET=<long-random-secret>

# Database
DATABASE_URL=postgresql://...

# Optional — defaults to localhost:3000 in dev
NEXT_PUBLIC_API_URL=https://yourapp.vercel.app
```

---

## Auth

- **Web**: NextAuth v5 cookie-based sessions.
- **Mobile**: POST `/api/mobile/auth` → 30-day JWT signed with `NEXTAUTH_SECRET`. Token stored in `expo-secure-store` and sent as `Authorization: Bearer <token>` on every API request. `requireUserId()` in `lib/auth.ts` checks cookie session first, then falls back to Bearer verification.

---

<!--
═══════════════════════════════════════════════════════════════════════════════
  PART D — CROSS-PLATFORM BUG FIX STRATEGY
═══════════════════════════════════════════════════════════════════════════════

D1 · Bug triage decision tree
──────────────────────────────
Bug found → ask:

  1. Is it wrong data, wrong calculation, or a broken API call?
     YES → Fix in packages/ or app/api/
           One fix resolves web + iOS + Android simultaneously.

  2. Is it UI-only and limited to one platform?
     YES → Fix only in components/ (web) or apps/mobile/components/ (mobile)
           No cross-platform action required.

  3. Is the same constant or copy hardcoded in multiple places?
     YES → Move it to packages/config/ or packages/utils/
           Fix once; both platforms reference the shared package.

  4. Is it an auth/session issue?
     WEB  → lib/auth.ts cookie path or NextAuth config
     MOBILE → lib/auth.ts Bearer path · apps/mobile/lib/authStore.ts

  5. Is it a type mismatch between API response and consumer?
     YES → Fix in packages/api/types.ts
           Compile-time error surfaces on both platforms immediately.

──────────────────────────────────────────────────────────────────────────────

D2 · Fix location table
────────────────────────
┌──────────────────────────────────────┬─────────────────────────────────────┐
│ Symptom                              │ Fix location                        │
├──────────────────────────────────────┼─────────────────────────────────────┤
│ Wrong amount / balance calculation   │ app/api/<module>/route.ts           │
│ Missing field in API response        │ app/api/<module>/route.ts +         │
│                                      │ packages/api/types.ts               │
│ Stale data / no invalidation         │ packages/api/<module>.ts            │
│                                      │ (check queryKey used in refetch)    │
│ Layout broken on web only            │ components/<module>/                │
│ Layout broken on mobile only         │ apps/mobile/components/             │
│ Layout broken on both                │ packages/ui/ (future) or fix in     │
│                                      │ both component trees                │
│ Wrong color / constant               │ packages/config/index.ts            │
│ Date formatting off                  │ packages/utils/index.ts             │
│ Zod validation rejecting valid input │ lib/validation.ts                   │
│                                      │ (packages/validation re-exports it) │
│ 401 on mobile                        │ lib/auth.ts Bearer path             │
│                                      │ apps/mobile/lib/authStore.ts        │
│ 401 on web                           │ lib/auth.ts cookie path             │
│                                      │ lib/auth.config.ts                  │
│ DB query missing userId filter       │ app/api/<module>/route.ts           │
│                                      │ (CRITICAL — security bug)           │
└──────────────────────────────────────┴─────────────────────────────────────┘

──────────────────────────────────────────────────────────────────────────────

D3 · Mobile release strategy
──────────────────────────────
MyOrbit mobile is distributed via Expo EAS (Expo Application Services).

Build types
  · Development build  — npx eas build --profile development --platform ios|android
  · Preview build      — OTA-updateable; share via TestFlight / internal track
  · Production build   — npx eas build --profile production

OTA updates (no App Store review required)
  · JS-only changes (components, screens, logic) → npx eas update --branch production
  · Native changes (new Expo SDK, new native module) → full EAS build required

Versioning
  · Bump `version` in apps/mobile/app.json for every production build.
  · OTA updates inherit the version of the binary they target.
  · Keep NEXTAUTH_SECRET in sync between deployed API and mobile binary.

──────────────────────────────────────────────────────────────────────────────

D4 · Branch strategy
──────────────────────
  main           → always deployable; Vercel auto-deploys from here
  claude/<name>  → agent work branches; PR → squash-merge to main
  fix/<ticket>   → bug fixes; short-lived; PR → squash-merge
  feat/<name>    → feature branches; PR → squash-merge

Rules
  · Never force-push main.
  · All PRs require at least one passing CI check (lint + build).
  · Mobile EAS builds are triggered from main only.
  · packages/ changes always bump the consuming app's minor version.

═══════════════════════════════════════════════════════════════════════════════
-->

## Tech stack

| Layer | Technology |
|---|---|
| Web framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth v5 (web) · JWT (mobile) |
| Mobile | Expo / React Native + NativeWind |
| Mobile routing | expo-router |
| Mobile state | Zustand (auth) · React Query (server state) |
| Icons | lucide-react / lucide-react-native |
| Monorepo tooling | Turborepo |

---

## Module overview

| Module | Web route | Tab |
|---|---|---|
| Today | `/orbit/today` | Today |
| Tasks | `/orbit/tasks` | Do |
| Finance | `/orbit/finance` | Money |
| Health | `/orbit/body` | Body |
| Reflect | `/orbit/reflect` | Reflect |
| Goals | `/orbit/goals` | — |
| Habits | `/orbit/habits` | — |

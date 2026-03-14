-- ============================================================
-- MyOrbit Finance Schema — PostgreSQL
-- Migration: 20260314201625_finance_schema
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE "User" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ── Sessions (NextAuth JWT fallback store) ───────────────────
CREATE TABLE "Session" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- ── Accounts ─────────────────────────────────────────────────
-- balance and creditLimit are AES-256-GCM encrypted strings
-- format: <ivHex>:<base64ciphertext>
CREATE TABLE "Account" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "balance"     TEXT NOT NULL,
    "creditLimit" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- ── Transactions ─────────────────────────────────────────────
-- amount is AES-256-GCM encrypted
CREATE TABLE "Transaction" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "accountId"   TEXT,
    "date"        TEXT NOT NULL,
    "category"    TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount"      TEXT NOT NULL,
    "type"        TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- ── Assets ───────────────────────────────────────────────────
-- value and invested are AES-256-GCM encrypted
CREATE TABLE "Asset" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "category"  TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "invested"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- ── Liabilities ──────────────────────────────────────────────
-- borrowed, outstanding, monthlyEmi, totalRepaid are AES-256-GCM encrypted
CREATE TABLE "Liability" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "lender"      TEXT,
    "borrowed"    TEXT NOT NULL,
    "outstanding" TEXT NOT NULL,
    "monthlyEmi"  TEXT NOT NULL,
    "emisLeft"    INTEGER NOT NULL,
    "totalRepaid" TEXT NOT NULL,
    "nextDueDate" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Liability_userId_idx" ON "Liability"("userId");

-- ── Budgets ──────────────────────────────────────────────────
CREATE TABLE "Budget" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "budget"    INTEGER NOT NULL,
    "spent"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- ── Foreign Keys ─────────────────────────────────────────────

ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account"
    ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Asset"
    ADD CONSTRAINT "Asset_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Liability"
    ADD CONSTRAINT "Liability_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Budget"
    ADD CONSTRAINT "Budget_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
import { z } from 'zod';

// Helper: rejects HTML tags in text fields (XSS prevention)
const noHtml = (field: string) =>
  z.string().refine((v) => !/<[^>]*>/.test(v), {
    message: `${field} cannot contain HTML`,
  });

export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string()
    .email()
    .refine((e) => e.toLowerCase().endsWith('@gmail.com'), {
      message: 'Only Gmail addresses (@gmail.com) are accepted for email sign-up.',
    }),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Account ──────────────────────────────────────────────────────────────────
// accountBaseSchema is exported so [id]/route.ts can call .partial() on it
// for PATCH requests. .partial() does not work on ZodEffects (after .refine()).
export const accountBaseSchema = z.object({
  name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
  type: z.enum(['Bank', 'Credit Card', 'Cash', 'Debit Card', 'Wallet']),
  balance: z.number().finite(),
  creditLimit: z.number().finite().optional(),
});

// accountSchema adds the cross-field negative-balance check for CREATE
// Use this in POST handlers. Use accountBaseSchema.partial() in PATCH handlers.
export const accountSchema = accountBaseSchema.refine(
  (data) => {
    // Only Credit Card accounts may have a negative balance
    if (data.type !== 'Credit Card' && data.balance < 0) return false;
    return true;
  },
  { message: 'Balance cannot be negative for this account type', path: ['balance'] }
);

// ── Transaction ───────────────────────────────────────────────────────────────
const recurringSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  customInterval: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endType: z.enum(['never', 'after', 'on_date']),
  endAfterTimes: z.number().int().positive().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).optional();

export const transactionSchema = z.object({
  accountId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  notes: z.string().max(1000).optional(),
  // Amount may be negative (expenses) or positive (income) — just not zero
  amount: z.number().finite().refine(v => v !== 0, { message: 'Amount must not be zero' }),
  type: z.enum(['expense', 'income', 'transfer', 'opening_balance', 'adjustment']),
  recurring: recurringSchema,
});

// ── Asset ─────────────────────────────────────────────────────────────────────
export const assetSchema = z.object({
  name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
  category: z.string().min(1),
  value: z.number().nonnegative('Asset value cannot be negative').finite(),
  invested: z.number().nonnegative('Invested amount cannot be negative').finite(),
  accountId: z.string().optional(),
  investmentType: z.enum(['lump_sum', 'sip']).optional(),
  sipConfig: z.union([z.string(), z.record(z.unknown())]).optional(), // string from web, object from mobile
});

// ── Liability ─────────────────────────────────────────────────────────────────
export const liabilitySchema = z.object({
  name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
  lender: z.string().optional(),
  borrowed: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
  monthlyEmi: z.number().nonnegative(),
  emisLeft: z.number().int().nonnegative(),
  totalRepaid: z.number().nonnegative(),
  nextDueDate: z.string().optional(),
  repaymentAccountId: z.string().optional(),
});

// ── Budget ────────────────────────────────────────────────────────────────────
export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  budget: z.number().int().positive('Budget must be a positive number'),
  spent: z.number().nonnegative().optional(),
  category: z.string().max(500).optional(),
});
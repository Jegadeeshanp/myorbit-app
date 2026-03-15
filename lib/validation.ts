import { z } from 'zod';

// Helper: rejects HTML tags in text fields (XSS prevention)
const noHtml = (field: string) =>
  z.string().refine((v) => !/<[^>]*>/.test(v), {
    message: `${field} cannot contain HTML`,
  });

export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const accountSchema = z
  .object({
    // FIX 1: XSS — reject HTML tags in name
    name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
    type: z.enum(['Bank', 'Credit Card', 'Cash', 'Debit Card', 'Wallet']),
    balance: z.number().finite(),
    creditLimit: z.number().finite().optional(),
  })
  .refine(
    (data) => {
      // FIX 2: Negative balance only allowed for Credit Card type
      if (data.type !== 'Credit Card' && data.balance < 0) return false;
      return true;
    },
    { message: 'Balance cannot be negative for this account type', path: ['balance'] }
  );

export const transactionSchema = z.object({
  accountId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  // FIX 3: was z.number().finite() — allows zero and negatives
  amount: z.number().positive('Amount must be greater than 0').finite(),
  type: z.enum(['expense', 'income']),
});

export const assetSchema = z.object({
  // FIX 4: XSS — reject HTML tags in name
  name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
  category: z.string().min(1),
  value: z.number().nonnegative('Asset value cannot be negative').finite(),
  invested: z.number().nonnegative('Invested amount cannot be negative').finite(),
});

export const liabilitySchema = z.object({
  // FIX 5: XSS — reject HTML tags in name
  name: noHtml('Name').and(z.string().min(1, 'Name is required').max(100)),
  lender: z.string().optional(),
  borrowed: z.number().nonnegative(),
  outstanding: z.number().nonnegative(),
  monthlyEmi: z.number().nonnegative(),
  emisLeft: z.number().int().nonnegative(),
  totalRepaid: z.number().nonnegative(),
  nextDueDate: z.string().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  budget: z.number().int().positive('Budget must be a positive number'),
  spent: z.number().int().nonnegative().optional(),
});
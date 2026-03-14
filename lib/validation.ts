import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['Bank', 'Credit Card', 'Cash', 'Debit Card', 'Wallet']),
  balance: z.number().finite(),
  creditLimit: z.number().finite().optional(),
});

export const transactionSchema = z.object({
  accountId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().finite(),
  type: z.enum(['expense', 'income']),
});

export const assetSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  value: z.number().nonnegative().finite(),
  invested: z.number().nonnegative().finite(),
});

export const liabilitySchema = z.object({
  name: z.string().min(1).max(100),
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
  budget: z.number().int().positive(),
  spent: z.number().int().nonnegative().optional(),
});

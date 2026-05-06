export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'https://project-al5r1.vercel.app';

export const COLORS = {
  emerald: '#10B981',
  rose:    '#F43F5E',
  blue:    '#3B82F6',
  slate:   '#64748B',
  bg:      '#F7F7F5',
} as const;

export const ACCOUNT_TYPES =
  ['Bank', 'Credit Card', 'Debit Card', 'Cash', 'Wallet'] as const;

export const PRIORITY_COLORS = {
  high:   '#F43F5E',
  medium: '#F59E0B',
  low:    '#3B82F6',
  none:   '#9CA3AF',
} as const;

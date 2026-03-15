// lib/currency.ts
// Indian currency formatting utilities.
// Replaces all manual fmt() functions scattered across finance pages.
//
// Usage:
//   import { formatINR, formatINRCompact, formatINRInput } from '@/lib/currency';
//   formatINR(150000)        → "₹1,50,000"
//   formatINRCompact(150000) → "₹1.50L"
//   formatINRCompact(10000000) → "₹1.00Cr"

// ── Full Indian number format ────────────────────────────────────────────────
// ₹1,50,000  (Indian lakh/crore grouping, not Western 1,500,000)
export function formatINR(amount: number, decimals = 0): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const formatted = abs.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return sign + formatted;
}

// ── Compact format for large numbers ────────────────────────────────────────
// ₹1.50L, ₹2.50Cr
export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000)    return `${sign}₹${(abs / 100_000).toFixed(2)}L`;
  if (abs >= 1_000)      return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

// ── For input fields — formats while typing ──────────────────────────────────
// Shows plain number for editing, formatted on blur
export function parseINR(value: string): number {
  // Remove ₹, commas, spaces
  return parseFloat(value.replace(/[₹,\s]/g, '')) || 0;
}

// ── Color helper for P&L ─────────────────────────────────────────────────────
export function pnlColor(value: number): string {
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-rose-600';
  return 'text-gray-600';
}

// ── Format percentage ────────────────────────────────────────────────────────
export function formatPct(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// ── Examples ─────────────────────────────────────────────────────────────────
// formatINR(84500)          → "₹84,500"
// formatINR(150000)         → "₹1,50,000"
// formatINR(2500000)        → "₹25,00,000"
// formatINR(10000000)       → "₹1,00,00,000"
// formatINRCompact(84500)   → "₹84.5K"
// formatINRCompact(150000)  → "₹1.50L"
// formatINRCompact(2500000) → "₹25.00L"
// formatINRCompact(10000000)→ "₹1.00Cr"

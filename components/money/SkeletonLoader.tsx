// components/finance/SkeletonLoader.tsx
// Skeleton loading states for finance pages.
// Use while financeStore loadState === 'loading'.
//
// Usage:
//   import { AccountsSkeleton, AssetsSkeleton, TransactionsSkeleton } from '@/components/money/SkeletonLoader';
//   if (state.loadState === 'loading') return <AccountsSkeleton />;

function Bone({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

// ── Generic card skeleton ────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-6 w-32" />
        </div>
        <Bone className="h-9 w-9 rounded-xl" />
      </div>
      <Bone className="h-3 w-full mb-2" />
      <Bone className="h-3 w-3/4" />
    </div>
  );
}

// ── Summary metric strip ─────────────────────────────────────────────────────
function MetricsSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-3`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <Bone className="h-9 w-9 flex-none rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Bone className="h-2.5 w-16" />
            <Bone className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Table row skeleton ───────────────────────────────────────────────────────
function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100">
      <Bone className="h-9 w-9 flex-none rounded-xl" />
      <div className="flex-1 space-y-1.5">
        <Bone className="h-3 w-32" />
        <Bone className="h-2.5 w-20" />
      </div>
      {Array.from({ length: cols - 2 }).map((_, i) => (
        <Bone key={i} className="h-3 w-20" />
      ))}
      <Bone className="h-7 w-16 rounded-full" />
    </div>
  );
}

// ── Accounts skeleton ────────────────────────────────────────────────────────
export function AccountsSkeleton() {
  return (
    <div className="space-y-5">
      <MetricsSkeleton cols={3} />
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <Bone className="h-4 w-32" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5">
            <TableRowSkeleton cols={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Assets skeleton ──────────────────────────────────────────────────────────
export function AssetsSkeleton() {
  return (
    <div className="space-y-5">
      <MetricsSkeleton cols={3} />
      {/* Category tabs skeleton */}
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5">
            <TableRowSkeleton cols={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Transactions skeleton ────────────────────────────────────────────────────
export function TransactionsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex gap-3">
        <Bone className="h-9 w-48 rounded-full" />
        <Bone className="h-9 w-32 rounded-full" />
        <Bone className="h-9 w-32 rounded-full" />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between">
          <Bone className="h-4 w-32" />
          <Bone className="h-4 w-20" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5">
            <TableRowSkeleton cols={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Liabilities skeleton ─────────────────────────────────────────────────────
export function LiabilitiesSkeleton() {
  return (
    <div className="space-y-5">
      <MetricsSkeleton cols={3} />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard overview skeleton ──────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Net worth hero */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <Bone className="h-3 w-20 mb-3" />
        <Bone className="h-8 w-40 mb-2" />
        <Bone className="h-3 w-28" />
        <Bone className="h-32 w-full rounded-xl mt-5" />
      </div>
      {/* Quick stats */}
      <MetricsSkeleton cols={4} />
      {/* Recent transactions */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <Bone className="h-4 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5">
            <TableRowSkeleton cols={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

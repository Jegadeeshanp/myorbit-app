/**
 * PageSkeleton — shown by each module's loading.tsx while route segments load.
 * Keeps the dark background consistent and provides pulsing card placeholders.
 */
export default function PageSkeleton() {
  return (
    <div className="space-y-5 p-1">
      {/* top bar placeholder */}
      <div className="h-10 w-40 rounded-xl bg-white/[0.06] animate-pulse" />

      {/* summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-white/[0.05] animate-pulse"
          />
        ))}
      </div>

      {/* card grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="h-36 rounded-2xl bg-white/[0.05] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

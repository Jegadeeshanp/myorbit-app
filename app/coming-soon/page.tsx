import Link from 'next/link';

export default function ComingSoon({
  searchParams,
}: {
  searchParams?: { feature?: string };
}) {
  const feature = searchParams?.feature ? String(searchParams.feature) : 'This feature';

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-10 rounded-3xl bg-white p-10 shadow-lg shadow-emerald-200/40">
        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
            🚧
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">{feature}</h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Coming Soon
            </p>
          </div>
        </div>

        <p className="text-base leading-relaxed text-gray-600">
          This module is currently under development. Stay tuned for updates.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
          >
            Back to Home
          </Link>
          <Link
            href="/orbit/finance"
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-700/30 transition hover:bg-emerald-800"
          >
            Go to Finance Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

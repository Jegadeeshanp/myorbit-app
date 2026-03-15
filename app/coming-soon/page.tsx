// app/coming-soon/page.tsx
// FIX: Next.js 16 requires searchParams to be awaited before accessing properties

type Props = {
  searchParams?: Promise<{ feature?: string }>;
};

export default async function ComingSoon({ searchParams }: Props) {
  // ✅ Await the searchParams promise before accessing .feature
  const params = await searchParams;
  const feature = params?.feature ? String(params.feature) : "This feature";

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-20">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Coming Soon</h1>
        <p className="text-gray-500 text-lg">
          {feature} is currently under development. Check back soon.
        </p>
      </div>
    </main>
  );
}
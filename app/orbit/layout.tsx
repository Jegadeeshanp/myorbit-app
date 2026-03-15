import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrbitClientWrapper from '@/components/OrbitClientWrapper';

export const runtime = 'nodejs';

export default async function OrbitLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return <OrbitClientWrapper>{children}</OrbitClientWrapper>;
}
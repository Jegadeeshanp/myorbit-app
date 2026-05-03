import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrbitClientWrapper from '@/components/OrbitClientWrapper';

export const runtime = 'nodejs';

const shouldSkipAuth = () => {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.SKIP_ORBIT_AUTH === '1') return true;
  if (process.env.PLAYWRIGHT_TEST === '1') return true;
  return false;
};

export default async function OrbitLayout({ children }: { children: React.ReactNode }) {
  if (shouldSkipAuth()) {
    return <OrbitClientWrapper>{children}</OrbitClientWrapper>;
  }
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return <OrbitClientWrapper>{children}</OrbitClientWrapper>;
}

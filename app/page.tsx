import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export const runtime = 'nodejs';

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect('/orbit');
  return <LandingPage />;
}

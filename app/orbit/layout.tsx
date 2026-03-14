import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function OrbitLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/signin');
  return <>{children}</>;
}

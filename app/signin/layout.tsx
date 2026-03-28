import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function SignInLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect('/orbit');
  return <>{children}</>;
}

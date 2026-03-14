import AuthGuard from '@/components/AuthGuard';

export default function OrbitLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

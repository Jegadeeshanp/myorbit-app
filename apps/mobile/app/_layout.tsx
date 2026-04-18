import { useEffect } from 'react';
import { Slot, Redirect } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/lib/authStore';

export default function RootLayout() {
  const { token, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  // Still reading SecureStore — render nothing (splash screen shows)
  if (isLoading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      {token
        ? <Redirect href="/(tabs)/today" />
        : <Redirect href="/(auth)/login" />
      }
      <Slot />
    </QueryClientProvider>
  );
}

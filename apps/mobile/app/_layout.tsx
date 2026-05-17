import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/lib/authStore';
import { useNotificationStore } from '@/lib/notificationStore';
import { setupNotifications } from '@/lib/notifications';
import { useThemeStore } from '@/lib/themeStore';
import AIFab from '@/components/shared/AIFab';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function OTAUpdateBootstrap() {
  useEffect(() => {
    if (!Updates.isEnabled) return;
    Updates.checkForUpdateAsync()
      .then(update => {
        if (update.isAvailable) {
          return Updates.fetchUpdateAsync().then(() => Updates.reloadAsync());
        }
      })
      .catch(() => {});
  }, []);
  return null;
}

function ThemeBootstrap() {
  const hydrate = useThemeStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}

function AuthBootstrap() {
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) router.replace('/(auth)/login');
    if (user && inAuthGroup) router.replace('/(tabs)/');
  }, [isLoading, segments, user]);

  return null;
}

function NotificationBootstrap() {
  const setPendingTaskId = useNotificationStore((s) => s.setPendingTaskId);

  useEffect(() => {
    setupNotifications().catch(() => {});

    // Handle tap when app is running or in background
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const taskId = response.notification.request.content.data?.taskId as string | undefined;
      if (taskId) {
        setPendingTaskId(taskId);
        router.navigate('/(tabs)/tasks');
      }
    });

    // Handle tap from cold start (app was killed)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const taskId = response.notification.request.content.data?.taskId as string | undefined;
      if (taskId) setPendingTaskId(taskId);
    }).catch(() => {});

    return () => sub.remove();
  }, [setPendingTaskId]);

  return null;
}

function GlobalOverlays() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return <AIFab />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <OTAUpdateBootstrap />
          <ThemeBootstrap />
          <AuthBootstrap />
          <NotificationBootstrap />
          <Stack screenOptions={{ headerShown: false }} />
          <GlobalOverlays />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

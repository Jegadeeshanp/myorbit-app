import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet, Target, Heart, Flame, CheckSquare, BarChart2,
  Settings, LogOut, Star, Sun, Moon,
} from 'lucide-react-native';
import { useThemeStore, getTheme } from '@/lib/themeStore';

const MODULES = [
  {
    key: 'finance',
    label: 'Finance',
    description: 'Track accounts, expenses, investments and budgets.',
    cta: 'Manage Money ->',
    icon: Wallet,
    color: '#10B981',
    route: '/(tabs)/finance',
  },
  {
    key: 'goals',
    label: 'Goals',
    description: 'Set and track personal targets with progress tracking.',
    cta: 'Start Achieving ->',
    icon: Target,
    color: '#3B82F6',
    route: '/(tabs)/goals',
  },
  {
    key: 'health',
    label: 'Health',
    description: 'Track sleep, workouts, meals and wellness trends.',
    cta: 'Track Wellness ->',
    icon: Heart,
    color: '#EF4444',
    route: '/(tabs)/health',
  },
  {
    key: 'habits',
    label: 'Habits',
    description: 'Build routines with streaks, nudges and daily consistency.',
    cta: 'Build Streaks ->',
    icon: Flame,
    color: '#F59E0B',
    route: '/(tabs)/habits',
  },
  {
    key: 'tasks',
    label: 'To-Do',
    description: 'Manage tasks, projects, quick notes and reminders.',
    cta: 'Get Things Done ->',
    icon: CheckSquare,
    color: '#10B981',
    route: '/(tabs)/tasks',
  },
  {
    key: 'insights',
    label: 'Insights',
    description: 'Discover trends, scores and personalized suggestions.',
    cta: 'Discover Insights ->',
    icon: BarChart2,
    color: '#64748B',
    route: '/(tabs)/insights',
  },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggle } = useThemeStore();
  const T = getTheme(isDark);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: '#10B981',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10B981',
              shadowOpacity: 0.35,
              shadowRadius: 14,
              elevation: 8,
              marginBottom: 14,
            }}
          >
            <Star size={28} color="white" fill="white" />
          </View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: T.text, letterSpacing: -0.5 }}>
            MyOrbit
          </Text>
          <Text style={{ fontSize: 17, color: '#10B981', fontWeight: '600', marginTop: 6 }}>
            Welcome back, {user?.name ?? 'there'}
          </Text>
          <Text style={{ fontSize: 15, color: T.subText, marginTop: 4, textAlign: 'center' }}>
            Choose what you want to manage today.
          </Text>
        </View>

        {/* ── Module Cards ── */}
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <View
              key={m.key}
              style={{
                backgroundColor: T.cardBg,
                borderRadius: 20,
                paddingHorizontal: 18,
                paddingVertical: 18,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: T.border,
              }}
            >
              {/* Icon + Title on same line */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: `${m.color}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={24} color={m.color} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: T.text, flex: 1 }}>
                  {m.label}
                </Text>
              </View>

              <Text style={{ fontSize: 15, color: T.subText, lineHeight: 22, marginBottom: 14 }}>
                {m.description}
              </Text>

              <TouchableOpacity
                onPress={() => router.push(m.route as any)}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 999,
                  paddingVertical: 13,
                  alignItems: 'center',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>{m.cta}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Bottom icon bar: light mode / settings / sign out ── */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            marginTop: 10,
            paddingVertical: 14,
            backgroundColor: T.cardBg,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: T.border,
          }}
        >
          <TouchableOpacity
            onPress={() => toggle()}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: '#10B98118',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            {isDark ? <Sun size={22} color="#10B981" /> : <Moon size={22} color="#10B981" />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: T.bg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: T.border,
            }}
            activeOpacity={0.7}
          >
            <Settings size={22} color={T.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: '#EF444415',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <LogOut size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

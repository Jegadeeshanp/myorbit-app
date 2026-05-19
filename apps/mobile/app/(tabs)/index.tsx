import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wallet, Target, Heart, Flame, CheckSquare, ChartBar,
  Settings, LogOut, Sun, Moon,
} from 'lucide-react-native';
import Svg, { Rect, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { useThemeStore, getTheme } from '@/lib/themeStore';
import { useModuleStore } from '@/lib/moduleStore';

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
    label: 'Tasks',
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
    icon: ChartBar,
    color: '#64748B',
    route: '/(tabs)/insights',
  },
];

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggle } = useThemeStore();
  const T = getTheme(isDark);
  const enabledModules = useModuleStore((s) => s.enabledModules);
  const visibleModules = MODULES.filter((m) => enabledModules.includes(m.key as any));

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
          <View style={{ shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 14, elevation: 8, marginBottom: 14 }}>
            <Svg width={68} height={68} viewBox="0 0 40 40">
              <Rect x="0" y="0" width="40" height="40" rx="10" ry="10" fill="#10B981" />
              <SvgCircle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none" />
              <SvgCircle cx="20" cy="7" r="2.5" fill="white" />
              <SvgCircle cx="33" cy="20" r="2.5" fill="white" />
              <SvgCircle cx="20" cy="33" r="2.5" fill="white" />
              <SvgCircle cx="7" cy="20" r="2.5" fill="white" />
              <SvgText x="20" y="26" textAnchor="middle" fontFamily="System" fontWeight="800" fontSize="16" fill="white">M</SvgText>
            </Svg>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: T.text, letterSpacing: -0.5 }}>
            MyOrbit
          </Text>
          <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '600', marginTop: 4 }}>
            Welcome back, {user?.name ?? 'there'}
          </Text>
          <Text style={{ fontSize: 13, color: T.subText, marginTop: 3, textAlign: 'center' }}>
            Choose what you want to manage today.
          </Text>
        </View>

        {/* ── Module Cards ── */}
        {visibleModules.map((m) => {
          const Icon = m.icon;
          return (
            <View
              key={m.key}
              style={{
                backgroundColor: T.cardBg,
                borderRadius: 24,
                paddingHorizontal: 22,
                paddingVertical: 24,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: T.border,
              }}
            >
              {/* Icon + Title on same line */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    backgroundColor: `${m.color}22`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={28} color={m.color} />
                </View>
                <Text style={{ fontSize: 19, fontWeight: '700', color: T.text, flex: 1 }}>
                  {m.label}
                </Text>
              </View>

              <Text style={{ fontSize: 13, color: T.subText, lineHeight: 20, marginBottom: 16 }}>
                {m.description}
              </Text>

              <TouchableOpacity
                onPress={() => router.push(m.route as any)}
                style={{
                  backgroundColor: '#10B981',
                  borderRadius: 999,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>{m.cta}</Text>
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
          }}
        >
          <TouchableOpacity onPress={() => toggle()} style={{ padding: 12 }} activeOpacity={0.7}>
            {isDark ? <Sun size={24} color="#10B981" /> : <Moon size={24} color="#10B981" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} style={{ padding: 12 }} activeOpacity={0.7}>
            <Settings size={24} color={T.subText} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout} style={{ padding: 12 }} activeOpacity={0.7}>
            <LogOut size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/authStore';
import { useThemeStore, getTheme } from '@/lib/themeStore';
import AppHeader from '@/components/shared/AppHeader';
import {
  User, Bell, Shield, LogOut, ChevronRight, Info, Database,
  Moon, Sun, Globe, CreditCard, Heart, Target, Flame, CheckSquare,
  ChartBar, DollarSign,
} from 'lucide-react-native';

// ── Section definitions ────────────────────────────────────────────────────────

function makeSection(title: string, items: SettingItem[]) { return { title, items }; }

interface SettingItem {
  label:    string;
  subtitle: string;
  icon:     React.ComponentType<{ size: number; color: string }>;
  color:    string;
  onPress?: () => void;
  right?:   React.ReactNode;
}

// ── Settings Screen ────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const user   = useAuthStore((s) => s.user);
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

  const SECTIONS = [
    makeSection('Profile', [
      {
        label: 'My Profile',
        subtitle: user?.name ?? 'Update your name and photo',
        icon: User,
        color: '#3B82F6',
      },
      {
        label: 'Email',
        subtitle: user?.email ?? 'Not set',
        icon: Globe,
        color: '#10B981',
      },
    ]),

    makeSection('Account', [
      {
        label: 'Notifications',
        subtitle: 'Push alerts & reminders',
        icon: Bell,
        color: '#F59E0B',
      },
      {
        label: 'Subscription',
        subtitle: 'Free plan',
        icon: CreditCard,
        color: '#8B5CF6',
      },
    ]),

    makeSection('Modules', [
      { label: 'Finance',  subtitle: 'Currency, default account',        icon: DollarSign,  color: '#10B981', onPress: () => router.push('/(tabs)/finance') },
      { label: 'Health',   subtitle: 'Units, step goal, reminders',      icon: Heart,       color: '#EF4444', onPress: () => router.push('/(tabs)/health') },
      { label: 'Habits',   subtitle: 'Week start, notification time',    icon: Flame,       color: '#F59E0B', onPress: () => router.push('/(tabs)/habits') },
      { label: 'Goals',    subtitle: 'Review frequency, horizon',        icon: Target,      color: '#3B82F6', onPress: () => router.push('/(tabs)/goals') },
      { label: 'To-Do',    subtitle: 'Default list, priority labels',    icon: CheckSquare, color: '#8B5CF6', onPress: () => router.push('/(tabs)/tasks') },
      { label: 'Insights', subtitle: 'Score weights, refresh interval',  icon: ChartBar,   color: '#64748B', onPress: () => router.push('/(tabs)/insights') },
    ]),

    makeSection('Data & Privacy', [
      {
        label: 'Privacy & Security',
        subtitle: 'Data controls & permissions',
        icon: Shield,
        color: '#8B5CF6',
      },
      {
        label: 'Export Data',
        subtitle: 'Download your data as CSV',
        icon: Database,
        color: '#64748B',
      },
    ]),

    makeSection('About', [
      {
        label: 'App Version',
        subtitle: 'MyOrbit v1.0.0',
        icon: Info,
        color: '#9CA3AF',
      },
    ]),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader title="Settings" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={{
          backgroundColor: T.cardBg, borderRadius: 20, padding: 16,
          marginBottom: 24, borderWidth: 1, borderColor: T.border,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: '#05966922',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#10B981' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: T.text }}>{user?.name ?? 'User'}</Text>
            <Text style={{ fontSize: 13, color: T.subText, marginTop: 2 }}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Appearance toggle — always first */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: T.subText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 2 }}>
          Appearance
        </Text>
        <View style={{ backgroundColor: T.cardBg, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#8B5CF615', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              {isDark ? <Moon size={18} color="#8B5CF6" /> : <Sun size={18} color="#8B5CF6" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>Dark Mode</Text>
              <Text style={{ fontSize: 12, color: T.subText, marginTop: 1 }}>
                {isDark ? 'Currently dark — tap to switch' : 'Currently light — tap to switch'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => toggle()}
              trackColor={{ false: '#3A3A3A', true: '#059669' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Dynamic sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: T.subText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 2 }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: T.cardBg, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' }}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={item.onPress ?? (() => {})}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 13,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: T.border,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Icon size={18} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>{item.label}</Text>
                      <Text style={{ fontSize: 12, color: T.subText, marginTop: 1 }}>{item.subtitle}</Text>
                    </View>
                    <ChevronRight size={16} color={T.subText} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: T.cardBg, borderRadius: 16, borderWidth: 1, borderColor: T.border,
            paddingHorizontal: 14, paddingVertical: 14,
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={18} color="#EF4444" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#EF4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

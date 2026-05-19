import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/lib/authStore';
import { useThemeStore, getTheme } from '@/lib/themeStore';
import { useModuleStore, type ModuleKey } from '@/lib/moduleStore';
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

const MODULE_META: Record<ModuleKey, { label: string; subtitle: string; icon: React.ComponentType<{ size: number; color: string }>; color: string }> = {
  finance:  { label: 'Finance',  subtitle: 'Accounts, expenses & investments', icon: DollarSign,  color: '#10B981' },
  tasks:    { label: 'Tasks',    subtitle: 'Tasks, projects & reminders',       icon: CheckSquare, color: '#8B5CF6' },
  habits:   { label: 'Habits',   subtitle: 'Streaks, routines & nudges',        icon: Flame,       color: '#F59E0B' },
  goals:    { label: 'Goals',    subtitle: 'Targets, milestones & progress',    icon: Target,      color: '#3B82F6' },
  health:   { label: 'Health',   subtitle: 'Sleep, workouts & wellness',        icon: Heart,       color: '#EF4444' },
  insights: { label: 'Insights', subtitle: 'Scores, trends & suggestions',      icon: ChartBar,   color: '#64748B' },
};

const MODULE_ORDER: ModuleKey[] = ['finance', 'tasks', 'habits', 'goals', 'health', 'insights'];

export default function SettingsScreen() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggle } = useThemeStore();
  const T = getTheme(isDark);
  const { enabledModules, toggle: toggleModule } = useModuleStore();

  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifGranted(status === 'granted');
    });
  }, []);

  const handleNotifications = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      Alert.alert('Notifications enabled', 'You\'ll receive reminders for tasks with due dates. Set a reminder when creating or editing a task.');
      return;
    }
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus === 'granted') {
      setNotifGranted(true);
      Alert.alert('Notifications enabled', 'You\'ll receive reminders for tasks with due dates.');
    } else {
      Alert.alert(
        'Enable Notifications',
        'Notifications are blocked. Open your device settings to allow them.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }, []);

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
        subtitle: notifGranted ? 'Enabled — task reminders active' : 'Tap to enable task reminders',
        icon: Bell,
        color: '#F59E0B',
        onPress: handleNotifications,
      },
      {
        label: 'Subscription',
        subtitle: 'Free plan',
        icon: CreditCard,
        color: '#8B5CF6',
      },
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

        {/* Active Modules */}
        <Text style={{ fontSize: 11, fontWeight: '600', color: T.subText, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 2 }}>
          Active Modules
        </Text>
        <Text style={{ fontSize: 12, color: T.subText, marginBottom: 10, paddingHorizontal: 2 }}>
          Only enabled modules appear on your home screen. At least one must stay active.
        </Text>
        <View style={{ backgroundColor: T.cardBg, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 20 }}>
          {MODULE_ORDER.map((key, idx) => {
            const meta = MODULE_META[key];
            const Icon = meta.icon;
            const isEnabled = enabledModules.includes(key);
            const isLast = idx === MODULE_ORDER.length - 1;
            const isOnlyOne = enabledModules.length === 1 && isEnabled;
            return (
              <View
                key={key}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 14, paddingVertical: 13,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: T.border,
                  opacity: isOnlyOne ? 0.5 : 1,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: meta.color + '18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Icon size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: T.text }}>{meta.label}</Text>
                  <Text style={{ fontSize: 12, color: T.subText, marginTop: 1 }}>{meta.subtitle}</Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => { if (!isOnlyOne) toggleModule(key); }}
                  trackColor={{ false: T.border, true: '#059669' }}
                  thumbColor="white"
                />
              </View>
            );
          })}
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

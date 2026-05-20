import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import {
  Wallet, Target, Heart, Flame, CheckSquare, ChartBar,
  Settings, LogOut, Sparkles, AlertTriangle, ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/authStore';
import { useTheme } from '@/lib/themeStore';
import { useModuleStore } from '@/lib/moduleStore';
import { getTodayTasks, getHabits, getGoals } from '@myorbit/api';

// ── Module config ─────────────────────────────────────────────────────────────

const ALL_MODULES = [
  { key: 'finance',  label: 'Finance',  icon: Wallet,      color: '#10B981', route: '/(tabs)/finance'  },
  { key: 'goals',    label: 'Goals',    icon: Target,      color: '#3B82F6', route: '/(tabs)/goals'    },
  { key: 'health',   label: 'Health',   icon: Heart,       color: '#EF4444', route: '/(tabs)/health'   },
  { key: 'habits',   label: 'Habits',   icon: Flame,       color: '#F59E0B', route: '/(tabs)/habits'   },
  { key: 'tasks',    label: 'Tasks',    icon: CheckSquare, color: '#10B981', route: '/(tabs)/tasks'    },
  { key: 'insights', label: 'Insights', icon: ChartBar,    color: '#64748B', route: '/(tabs)/insights' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildSummaryText(
  habitsDone: number,
  habitsTotal: number,
  overdue: number,
  nearestGoal: string | null,
) {
  const parts: string[] = [];
  if (habitsTotal > 0) {
    const pct = Math.round((habitsDone / habitsTotal) * 100);
    if (pct === 100) parts.push(`All ${habitsTotal} habits done — great work!`);
    else if (pct >= 50) parts.push(`Halfway through your habits — ${habitsDone}/${habitsTotal} done.`);
    else parts.push(`${habitsDone}/${habitsTotal} habits done so far today.`);
  }
  if (overdue > 0) {
    parts.push(`${overdue} overdue task${overdue > 1 ? 's' : ''} need${overdue === 1 ? 's' : ''} attention — start with the top priority.`);
  } else {
    parts.push('No overdue tasks. You\'re on track!');
  }
  if (nearestGoal) parts.push(`Active goal: ${nearestGoal}.`);
  return parts.join(' ');
}

function formatNetWorth(n: number) {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000)   return `₹${Math.round(n / 1000)}k`;
  return `₹${Math.round(n)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const T = useTheme();
  const enabledModules = useModuleStore((s) => s.enabledModules);
  const visibleModules = ALL_MODULES.filter((m) => enabledModules.includes(m.key as any));
  const qc = useQueryClient();

  // Refresh on tab focus
  useFocusEffect(useCallback(() => {
    qc.invalidateQueries({ queryKey: ['home-tasks'] });
    qc.invalidateQueries({ queryKey: ['home-habits'] });
    qc.invalidateQueries({ queryKey: ['home-goals'] });
  }, [qc]));

  const { data: todayData } = useQuery({
    queryKey: ['home-tasks'],
    queryFn: getTodayTasks,
    staleTime: 0,
  });

  const { data: habits = [] } = useQuery({
    queryKey: ['home-habits'],
    queryFn: getHabits,
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['home-goals'],
    queryFn: getGoals,
    staleTime: 0,
  });

  const today = new Date().toISOString().split('T')[0];
  const overdueTasks  = todayData?.overdue ?? [];
  const todayTasks    = todayData?.today   ?? [];
  const allFocusTasks = [...overdueTasks, ...todayTasks];
  const totalTasks    = allFocusTasks.length + (todayData?.completed?.length ?? 0);

  const activeHabits  = habits.filter((h) => h.isActive);
  const habitsDone    = activeHabits.filter((h) => h.logs?.some((l) => l.logDate === today)).length;
  const habitsTotal   = activeHabits.length;

  const activeGoals   = goals.filter((g) => g.status === 'active');
  const nearestGoal   = activeGoals
    .filter((g) => g.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0];

  const summaryText = buildSummaryText(habitsDone, habitsTotal, overdueTasks.length, nearestGoal?.title ?? null);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  const PRIORITY_COLOR: Record<string, string> = {
    high: '#EF4444', medium: '#F59E0B', low: '#10B981', none: T.subText,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: T.text }}>
              {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
            </Text>
            <Text style={{ fontSize: 12, color: T.subText, marginTop: 1 }}>{formatDate()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/settings')}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.cardBg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Settings size={17} color={T.subText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.cardBg, alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={17} color={T.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Daily Orbit Card ── */}
        <View style={{
          backgroundColor: '#052e16',
          borderRadius: 20,
          padding: 18,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: '#14532d',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Sparkles size={14} color='#10B981' />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', letterSpacing: 1 }}>DAILY ORBIT</Text>
          </View>
          <Text style={{ fontSize: 15, color: '#d1fae5', lineHeight: 22, marginBottom: 14 }}>
            {summaryText}
          </Text>
          {/* Stat chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {habitsTotal > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#064e3b', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Flame size={11} color='#10B981' />
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>{habitsDone}/{habitsTotal} habits</Text>
              </View>
            )}
            {overdueTasks.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#450a0a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <AlertTriangle size={11} color='#FCA5A5' />
                <Text style={{ fontSize: 11, color: '#FCA5A5', fontWeight: '600' }}>{overdueTasks.length} overdue</Text>
              </View>
            )}
            {nearestGoal && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e1b4b', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Target size={11} color='#818cf8' />
                <Text style={{ fontSize: 11, color: '#818cf8', fontWeight: '600' }} numberOfLines={1}>
                  {nearestGoal.title.length > 18 ? nearestGoal.title.slice(0, 18) + '…' : nearestGoal.title}
                  {nearestGoal.deadline ? ` · ${Math.ceil((new Date(nearestGoal.deadline).getTime() - Date.now()) / 86400000)}d` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Module shortcuts ── */}
        <View style={{
          backgroundColor: T.cardBg,
          borderRadius: 20,
          padding: 12,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: T.border,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {visibleModules.map((m) => {
              const Icon = m.icon;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => router.push(m.route as any)}
                  activeOpacity={0.7}
                  style={{ alignItems: 'center', gap: 6, flex: 1 }}
                >
                  <View style={{
                    width: 42, height: 42, borderRadius: 13,
                    backgroundColor: `${m.color}20`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={m.color} />
                  </View>
                  <Text style={{ fontSize: 10, color: T.subText, fontWeight: '500' }}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Today's Focus ── */}
        <View style={{
          backgroundColor: T.cardBg,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: T.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T.text }}>Today's Focus</Text>
              <Text style={{ fontSize: 11, color: T.subText, marginTop: 1 }}>
                {overdueTasks.length > 0 ? `${overdueTasks.length} overdue · ` : ''}{totalTasks} total
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>All tasks</Text>
              <ChevronRight size={14} color='#10B981' />
            </TouchableOpacity>
          </View>

          {allFocusTasks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 13, color: T.subText }}>No tasks for today 🎉</Text>
            </View>
          ) : (
            <>
              {allFocusTasks.slice(0, 5).map((t, i) => {
                const isOverdue = overdueTasks.some((o) => o.id === t.id);
                const priority  = t.task?.priority ?? 'none';
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => router.push('/(tabs)/tasks')}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 10,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: T.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isOverdue ? '#EF4444' : T.subText, width: 18, textAlign: 'center' }}>
                      {i + 1}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: T.text }} numberOfLines={1}>
                        {t.task?.title ?? 'Task'}
                      </Text>
                      {isOverdue ? (
                        <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 1 }}>Overdue</Text>
                      ) : t.task?.dueTime ? (
                        <Text style={{ fontSize: 11, color: T.subText, marginTop: 1 }}>{t.task.dueTime}</Text>
                      ) : null}
                    </View>
                    {priority !== 'none' && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: PRIORITY_COLOR[priority] ?? T.subText, textTransform: 'uppercase' }}>
                        {priority}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {allFocusTasks.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/tasks')}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 10,
                    backgroundColor: T.surfaceAlt ?? T.surface,
                    borderRadius: 12,
                    paddingVertical: 11,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, color: T.subText, fontWeight: '500' }}>
                    +{allFocusTasks.length - 5} more tasks
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Floating AI button ── */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/insights')}
        style={{
          position: 'absolute', right: 20, bottom: 90,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: '#10B981',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#10B981', shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
        }}
        activeOpacity={0.85}
      >
        <Sparkles size={22} color='white' />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
